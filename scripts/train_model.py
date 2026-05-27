from __future__ import annotations

import argparse
import json
import math
import re
import sys
import unicodedata
from collections import defaultdict, deque
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "data" / "raw" / "results.csv"
DEFAULT_OUTPUT = ROOT / "src" / "data" / "modelPredictions.ts"
DEFAULT_MODEL_DIR = ROOT / "models"


ALIASES = {
    "usa": "united states",
    "united states of america": "united states",
    "korea republic": "south korea",
    "czechia": "czech republic",
    "turkiye": "turkey",
    "cote divoire": "ivory coast",
    "cote d ivoire": "ivory coast",
    "dr congo": "congo dr",
    "cape verde": "cape verde",
}


def normalize_name(value: str) -> str:
    text = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-zA-Z0-9]+", " ", text).strip().lower()
    return ALIASES.get(text, text)


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def tournament_weight(name: str) -> float:
    lowered = name.lower()
    if "world cup" in lowered and "qualification" not in lowered:
        return 1.35
    if any(token in lowered for token in ["euro", "copa america", "africa cup", "asian cup", "gold cup", "nations league"]):
        return 1.18
    if "qualification" in lowered or "qualifier" in lowered:
        return 1.08
    if "friendly" in lowered:
        return 0.72
    return 1.0


def parse_project_teams(path: Path) -> list[dict[str, object]]:
    text = path.read_text(encoding="utf-8")
    blocks = re.findall(r"\{\s*id:\s*\"[^\"]+\".*?\n\s*\},", text, flags=re.S)
    rows: list[dict[str, object]] = []

    for block in blocks:
        def string_field(name: str) -> str:
            match = re.search(rf"{name}:\s*\"([^\"]+)\"", block)
            return match.group(1) if match else ""

        def number_field(name: str, default: float = 0) -> float:
            match = re.search(rf"{name}:\s*([0-9.]+)", block)
            return float(match.group(1)) if match else default

        team_id = string_field("id")
        team_name = string_field("name")
        if not team_id or not team_name:
            continue

        rows.append(
            {
                "id": team_id,
                "name": team_name,
                "normalized": normalize_name(team_name),
                "strengthRank": number_field("strengthRank", 48),
                "strengthScore": number_field("strengthScore", 50),
                "squadValueEurM": number_field("squadValueEurM", 0),
            }
        )

    return rows


def rolling_average(values: deque[float], default: float) -> float:
    if not values:
        return default
    return sum(values) / len(values)


def expected_score(elo_a: float, elo_b: float) -> float:
    return 1 / (1 + math.pow(10, (elo_b - elo_a) / 400))


def update_elo(elo_a: float, elo_b: float, result_a: float, weight: float) -> tuple[float, float]:
    k = 24 * weight
    expected_a = expected_score(elo_a, elo_b)
    delta = k * (result_a - expected_a)
    return elo_a + delta, elo_b - delta


def json_for_ts(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2)


def main() -> int:
    parser = argparse.ArgumentParser(description="Train the offline World Cup prediction model.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="Historical results CSV path.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="TypeScript output path.")
    parser.add_argument("--model-dir", type=Path, default=DEFAULT_MODEL_DIR, help="Optional local model artifact directory.")
    args = parser.parse_args()

    if not args.input.exists():
        print(f"Missing historical results CSV: {args.input}")
        print("Place a legally obtained CSV at data/raw/results.csv, then run npm run ml:train again.")
        print("Expected columns: date, home_team, away_team, home_score, away_score, tournament, neutral.")
        return 0

    try:
        import joblib
        import pandas as pd
        from sklearn.ensemble import HistGradientBoostingClassifier
        from sklearn.linear_model import LogisticRegression
        from sklearn.metrics import accuracy_score
        from sklearn.model_selection import train_test_split
        from sklearn.pipeline import make_pipeline
        from sklearn.preprocessing import StandardScaler
    except ImportError as exc:
        print(f"Missing Python ML dependency: {exc}")
        print("Install dependencies with: python -m pip install -r requirements-ml.txt")
        return 1

    teams = parse_project_teams(ROOT / "src" / "data" / "teams.ts")
    if not teams:
        print("Could not parse src/data/teams.ts")
        return 1

    results = pd.read_csv(args.input)
    required = {"date", "home_team", "away_team", "home_score", "away_score", "tournament", "neutral"}
    missing = required.difference(results.columns)
    if missing:
        print(f"Historical CSV is missing required columns: {', '.join(sorted(missing))}")
        return 1

    results = results.dropna(subset=["date", "home_team", "away_team", "home_score", "away_score"])
    results["date"] = pd.to_datetime(results["date"], errors="coerce")
    results = results.dropna(subset=["date"]).sort_values("date")

    elo = defaultdict(lambda: 1500.0)
    recent_points: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=10))
    recent_goal_diff: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=10))
    recent_goals_for: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=10))
    recent_goals_against: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=10))
    features: list[list[float]] = []
    labels: list[int] = []

    for row in results.itertuples(index=False):
        home = normalize_name(str(row.home_team))
        away = normalize_name(str(row.away_team))
        home_score = int(row.home_score)
        away_score = int(row.away_score)
        neutral = 1 if bool(row.neutral) else 0
        weight = tournament_weight(str(row.tournament))
        home_points = 3 if home_score > away_score else 1 if home_score == away_score else 0
        away_points = 3 if away_score > home_score else 1 if home_score == away_score else 0

        features.append(
            [
                elo[home] - elo[away],
                rolling_average(recent_points[home], 1.2) - rolling_average(recent_points[away], 1.2),
                rolling_average(recent_goal_diff[home], 0) - rolling_average(recent_goal_diff[away], 0),
                rolling_average(recent_goals_for[home], 1.2) - rolling_average(recent_goals_for[away], 1.2),
                rolling_average(recent_goals_against[away], 1.2) - rolling_average(recent_goals_against[home], 1.2),
                neutral,
                0 if neutral else 1,
                weight,
            ]
        )
        labels.append(0 if home_score > away_score else 1 if home_score == away_score else 2)

        result_home = 1.0 if home_score > away_score else 0.5 if home_score == away_score else 0.0
        elo[home], elo[away] = update_elo(elo[home], elo[away], result_home, weight)
        recent_points[home].append(home_points)
        recent_points[away].append(away_points)
        recent_goal_diff[home].append(home_score - away_score)
        recent_goal_diff[away].append(away_score - home_score)
        recent_goals_for[home].append(home_score)
        recent_goals_for[away].append(away_score)
        recent_goals_against[home].append(away_score)
        recent_goals_against[away].append(home_score)

    if len(features) < 100:
        print("Not enough historical rows to train a useful model. Provide a larger results.csv.")
        return 1

    x_train, x_test, y_train, y_test = train_test_split(features, labels, test_size=0.2, shuffle=False)
    model = HistGradientBoostingClassifier(max_iter=220, learning_rate=0.045, random_state=42)
    baseline = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000, multi_class="auto"))
    model.fit(x_train, y_train)
    baseline.fit(x_train, y_train)
    model_accuracy = float(accuracy_score(y_test, model.predict(x_test)))
    baseline_accuracy = float(accuracy_score(y_test, baseline.predict(x_test)))

    if baseline_accuracy > model_accuracy:
        selected_model = baseline
        model_name = "Logistic Regression Baseline"
        validation_accuracy = baseline_accuracy
    else:
        selected_model = model
        model_name = "HistGradientBoostingClassifier"
        validation_accuracy = model_accuracy

    args.model_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(selected_model, args.model_dir / "world_cup_prediction_model.joblib")

    elo_values = list(elo.values()) or [1500.0]
    min_elo, max_elo = min(elo_values), max(elo_values)
    profiles = []

    for team in teams:
        normalized = str(team["normalized"])
        team_elo = elo[normalized]
        elo_score = 50 if max_elo == min_elo else 100 * (team_elo - min_elo) / (max_elo - min_elo)
        recent_form = rolling_average(recent_points[normalized], 1.2) / 3 * 100
        recent_gd = rolling_average(recent_goal_diff[normalized], 0)
        attack = rolling_average(recent_goals_for[normalized], 1.2) / 3 * 100
        defense = (1 - min(3, rolling_average(recent_goals_against[normalized], 1.2)) / 3) * 100
        squad_value = float(team["squadValueEurM"])
        value_score = math.log10(max(1, squad_value)) / math.log10(1300) * 100
        strength_score = float(team["strengthScore"])
        strength_rank = float(team["strengthRank"])
        rank_score = clamp(102 - strength_rank * 1.35, 25, 98)
        ml_strength = clamp(strength_score * 0.32 + elo_score * 0.28 + recent_form * 0.18 + value_score * 0.14 + rank_score * 0.08, 30, 98)
        confidence = clamp(ml_strength * 0.52 + recent_form * 0.22 + defense * 0.14 + rank_score * 0.12, 30, 96)
        risk = "low" if strength_rank <= 8 and confidence >= 75 else "medium" if strength_rank <= 20 and confidence >= 58 else "high"

        profiles.append(
            {
                "teamId": team["id"],
                "mlStrengthScore": round(ml_strength),
                "recentFormScore": round(clamp(recent_form + recent_gd * 6, 20, 98)),
                "attackTrend": round(clamp(attack, 20, 98)),
                "defenseTrend": round(clamp(defense, 20, 98)),
                "confidenceScore": round(confidence),
                "upsetRisk": risk,
                "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals.",
            }
        )

    meta = {
        "modelName": model_name,
        "trainedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "trainingDataCutoff": str(results["date"].max().date()),
        "dataSources": [
            "Local data/raw/results.csv",
            "Project team strength data",
            "Projected squad and market-value fields",
        ],
        "validationAccuracy": round(validation_accuracy, 4),
        "notes": f"Baseline validation accuracy: {baseline_accuracy:.3f}. Selected model validation accuracy: {validation_accuracy:.3f}.",
    }

    output = f'''import type {{ ModelPredictionProfile, PredictionModelMeta }} from "../types/worldCup";

export const predictionModelMeta: PredictionModelMeta = {json_for_ts(meta)};

export const modelPredictionProfiles: ModelPredictionProfile[] = {json_for_ts(profiles)};
'''
    args.output.write_text(output, encoding="utf-8")
    print(f"Wrote {args.output}")
    print(f"Selected model: {model_name} ({validation_accuracy:.3f} validation accuracy)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
