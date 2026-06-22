from __future__ import annotations

import argparse
import json
import math
import re
import sys
import unicodedata
from collections import defaultdict, deque
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "data" / "raw" / "results.csv"
DEFAULT_CURRENT_STATE = ROOT / "data" / "current" / "world_cup_2026_state.json"
DEFAULT_BASELINE_SIGNALS = ROOT / "data" / "current" / "team_baseline_signals.json"
DEFAULT_OUTPUT = ROOT / "src" / "data" / "modelPredictions.ts"
DEFAULT_PROFILE_JSON = ROOT / "outputs" / "current_model_profiles.json"
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
        return 2.4
    if any(token in lowered for token in ["euro", "copa america", "africa cup", "asian cup", "gold cup", "nations league"]):
        return 1.35
    if "qualification" in lowered or "qualifier" in lowered:
        return 1.1
    if "friendly" in lowered:
        return 0.55
    return 1.0


def recency_weight(match_date, reference_date, half_life_years: float = 4.0) -> float:
    age_years = max(0.0, (reference_date - match_date).days / 365.25)
    return max(0.12, math.pow(0.5, age_years / half_life_years))


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


def parse_current_squad_signals(path: Path) -> dict[str, float]:
    text = path.read_text(encoding="utf-8")
    rows = defaultdict(lambda: {"count": 0, "key": 0, "starters": 0, "positions": set()})
    for block in re.findall(r"\{ teamId: \"[^\"]+\".*? \},", text):
        team_match = re.search(r'teamId: "([^"]+)"', block)
        position_match = re.search(r'position: "(GK|DF|MF|FW)"', block)
        if not team_match or not position_match:
            continue
        row = rows[team_match.group(1)]
        row["count"] += 1
        row["key"] += 1 if "isKeyPlayer: true" in block else 0
        row["starters"] += 1 if "predictedStarter: true" in block else 0
        row["positions"].add(position_match.group(1))

    signals = {}
    for team_id, row in rows.items():
        position_coverage = len(row["positions"]) / 4 * 100
        key_depth = min(1, row["key"] / 4) * 100
        starter_readiness = min(1, row["starters"] / 7) * 100
        sample_coverage = min(1, row["count"] / 8) * 100
        signals[team_id] = round(
            position_coverage * 0.32 + key_depth * 0.24
            + starter_readiness * 0.24 + sample_coverage * 0.20,
            2,
        )
    return signals


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


def append_result(home, away, home_score, away_score, weight, elo, recent_points,
                  recent_goal_diff, recent_goals_for, recent_goals_against) -> None:
    home_points = 3 if home_score > away_score else 1 if home_score == away_score else 0
    away_points = 3 if away_score > home_score else 1 if home_score == away_score else 0
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


def merged_team_context(current_state: dict, team_id: str) -> dict:
    defaults = current_state.get("defaultFactors", {})
    override = current_state.get("teams", {}).get(team_id, {})
    availability = float(override.get("availabilityScore", defaults.get("availabilityScore", 90)))
    tactical_fit = float(override.get("tacticalFitScore", defaults.get("tacticalFitScore", 82)))
    cohesion = float(override.get("cohesionScore", defaults.get("cohesionScore", 84)))
    player_fit = float(override.get("playerFitScore", tactical_fit * 0.45 + cohesion * 0.55))
    return {
        "availabilityScore": availability,
        "tacticalFitScore": tactical_fit,
        "playerFitScore": player_fit,
        "cohesionScore": cohesion,
        "coachAdaptabilityScore": float(override.get("coachAdaptabilityScore", defaults.get("coachAdaptabilityScore", 82))),
        "keyAbsences": list(override.get("keyAbsences", defaults.get("keyAbsences", []))),
        "keyAbsencesZh": list(override.get("keyAbsencesZh", defaults.get("keyAbsencesZh", []))),
        "tacticalNotes": list(override.get("tacticalNotes", defaults.get("tacticalNotes", []))),
        "tacticalNotesZh": list(override.get("tacticalNotesZh", defaults.get("tacticalNotesZh", []))),
    }


def json_for_ts(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2)


def main() -> int:
    parser = argparse.ArgumentParser(description="Train the offline World Cup prediction model.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="Historical results CSV path.")
    parser.add_argument("--current-state", type=Path, default=DEFAULT_CURRENT_STATE, help="Current tournament state JSON.")
    parser.add_argument("--baseline-signals", type=Path, default=DEFAULT_BASELINE_SIGNALS, help="Frozen pre-tournament team signals JSON.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="TypeScript output path.")
    parser.add_argument("--profile-json", type=Path, default=DEFAULT_PROFILE_JSON, help="Machine-readable profile output.")
    parser.add_argument("--model-dir", type=Path, default=DEFAULT_MODEL_DIR, help="Optional local model artifact directory.")
    parser.add_argument(
        "--world-cup-only",
        action="store_true",
        help="Train only on FIFA World Cup final tournament matches. Qualification and future fixtures without scores are excluded.",
    )
    args = parser.parse_args()

    if not args.input.exists():
        print(f"Missing historical results CSV: {args.input}")
        print("Place a legally obtained CSV at data/raw/results.csv, then run npm run ml:train again.")
        print("Expected columns: date, home_team, away_team, home_score, away_score, tournament, neutral.")
        return 0

    if not args.current_state.exists():
        print(f"Missing current tournament state: {args.current_state}")
        return 1
    if not args.baseline_signals.exists():
        print(f"Missing frozen baseline signals: {args.baseline_signals}")
        return 1

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
    baseline_signals = json.loads(args.baseline_signals.read_text(encoding="utf-8")).get("teams", {})
    for team in teams:
        baseline = baseline_signals.get(str(team["id"]))
        if baseline:
            team["strengthRank"] = float(baseline["strengthRank"])
            team["strengthScore"] = float(baseline["strengthScore"])
            team["squadValueEurM"] = float(baseline.get("squadValueEurM", team["squadValueEurM"]))
    teams_by_id = {str(team["id"]): team for team in teams}
    squad_signals = parse_current_squad_signals(ROOT / "src" / "data" / "players.ts")
    current_state = json.loads(args.current_state.read_text(encoding="utf-8"))

    results = pd.read_csv(args.input)
    required = {"date", "home_team", "away_team", "home_score", "away_score", "tournament", "neutral"}
    missing = required.difference(results.columns)
    if missing:
        print(f"Historical CSV is missing required columns: {', '.join(sorted(missing))}")
        return 1

    results = results.dropna(subset=["date", "home_team", "away_team", "home_score", "away_score"])
    if args.world_cup_only:
        results = results[results["tournament"].eq("FIFA World Cup")]
    results["date"] = pd.to_datetime(results["date"], errors="coerce")
    results = results.dropna(subset=["date"]).sort_values("date")
    if results.empty:
        print("No scored matches were available after filtering.")
        return 1

    reference_date = pd.Timestamp(current_state.get("competitionDateCutoff", results["date"].max()))
    elo = defaultdict(lambda: 1500.0)
    recent_points: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=10))
    recent_goal_diff: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=10))
    recent_goals_for: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=10))
    recent_goals_against: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=10))
    features: list[list[float]] = []
    labels: list[int] = []
    sample_weights: list[float] = []

    for row in results.itertuples(index=False):
        home = normalize_name(str(row.home_team))
        away = normalize_name(str(row.away_team))
        home_score = int(row.home_score)
        away_score = int(row.away_score)
        neutral = 1 if bool(row.neutral) else 0
        competition_weight = tournament_weight(str(row.tournament))
        weight = competition_weight * recency_weight(row.date, reference_date)
        features.append(
            [
                elo[home] - elo[away],
                rolling_average(recent_points[home], 1.2) - rolling_average(recent_points[away], 1.2),
                rolling_average(recent_goal_diff[home], 0) - rolling_average(recent_goal_diff[away], 0),
                rolling_average(recent_goals_for[home], 1.2) - rolling_average(recent_goals_for[away], 1.2),
                rolling_average(recent_goals_against[away], 1.2) - rolling_average(recent_goals_against[home], 1.2),
                neutral,
                0 if neutral else 1,
                competition_weight,
                weight,
            ]
        )
        labels.append(0 if home_score > away_score else 1 if home_score == away_score else 2)
        sample_weights.append(weight)

        append_result(home, away, home_score, away_score, weight, elo, recent_points,
                      recent_goal_diff, recent_goals_for, recent_goals_against)

    if len(features) < 100:
        print("Not enough historical rows to train a useful model. Provide a larger results.csv.")
        return 1

    x_train, x_test, y_train, y_test, w_train, w_test = train_test_split(
        features,
        labels,
        sample_weights,
        test_size=0.2,
        shuffle=False,
    )
    model = HistGradientBoostingClassifier(
        max_iter=240, learning_rate=0.04, l2_regularization=0.15, random_state=42,
    )
    baseline = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
    model.fit(x_train, y_train, sample_weight=w_train)
    baseline.fit(x_train, y_train, logisticregression__sample_weight=w_train)
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

    tournament_stats = defaultdict(
        lambda: {"matches": 0, "points": 0, "goalsFor": 0, "goalsAgainst": 0, "opponentEloTotal": 0.0}
    )
    current_results = current_state.get("actualResults", [])
    for result in sorted(current_results, key=lambda item: item["date"]):
        home_id = str(result["homeTeamId"])
        away_id = str(result["awayTeamId"])
        if home_id not in teams_by_id or away_id not in teams_by_id:
            print(f"Unknown current-result team id: {home_id} or {away_id}")
            return 1
        home = str(teams_by_id[home_id]["normalized"])
        away = str(teams_by_id[away_id]["normalized"])
        home_score = int(result["homeScore"])
        away_score = int(result["awayScore"])
        home_points = 3 if home_score > away_score else 1 if home_score == away_score else 0
        away_points = 3 if away_score > home_score else 1 if home_score == away_score else 0
        for team_id, points, goals_for, goals_against, opponent in [
            (home_id, home_points, home_score, away_score, away),
            (away_id, away_points, away_score, home_score, home),
        ]:
            tournament_stats[team_id]["matches"] += 1
            tournament_stats[team_id]["points"] += points
            tournament_stats[team_id]["goalsFor"] += goals_for
            tournament_stats[team_id]["goalsAgainst"] += goals_against
            tournament_stats[team_id]["opponentEloTotal"] += elo[opponent]
        append_result(
            home, away, home_score, away_score, tournament_weight("FIFA World Cup"), elo,
            recent_points, recent_goal_diff, recent_goals_for, recent_goals_against,
        )

    project_elos = [elo[str(team["normalized"])] for team in teams]
    min_elo, max_elo = min(project_elos), max(project_elos)
    profiles = []

    for team in teams:
        team_id = str(team["id"])
        normalized = str(team["normalized"])
        team_elo = elo[normalized]
        elo_score = 50 if max_elo == min_elo else 100 * (team_elo - min_elo) / (max_elo - min_elo)
        recent_form = rolling_average(recent_points[normalized], 1.2) / 3 * 100
        recent_gd = rolling_average(recent_goal_diff[normalized], 0)
        historical_attack = rolling_average(recent_goals_for[normalized], 1.2) / 3 * 100
        historical_defense = (1 - min(3, rolling_average(recent_goals_against[normalized], 1.2)) / 3) * 100
        squad_value = float(team["squadValueEurM"])
        value_score = math.log10(max(1, squad_value)) / math.log10(1300) * 100
        rank_score = clamp(102 - float(team["strengthRank"]) * 1.35, 25, 98)
        historical_base = (
            float(team["strengthScore"]) * 0.14 + elo_score * 0.22 + recent_form * 0.18
            + historical_attack * 0.10 + historical_defense * 0.10 + value_score * 0.10
            + rank_score * 0.10 + squad_signals.get(team_id, 55) * 0.06
        )

        stats = tournament_stats[team_id]
        match_count = int(stats["matches"])
        if match_count:
            points_per_game = float(stats["points"]) / match_count
            goals_for_per_game = float(stats["goalsFor"]) / match_count
            goals_against_per_game = float(stats["goalsAgainst"]) / match_count
            goal_difference_per_game = goals_for_per_game - goals_against_per_game
            opponent_elo = float(stats["opponentEloTotal"]) / match_count
            opponent_quality = 50 if max_elo == min_elo else 100 * (opponent_elo - min_elo) / (max_elo - min_elo)
            tournament_attack = clamp(28 + goals_for_per_game * 22, 20, 98)
            tournament_defense = clamp(96 - goals_against_per_game * 28, 20, 98)
            tournament_form = clamp(
                (points_per_game / 3 * 100) * 0.42
                + clamp(50 + goal_difference_per_game * 16, 15, 98) * 0.28
                + tournament_attack * 0.13 + tournament_defense * 0.12 + opponent_quality * 0.05,
                20, 98,
            )
        else:
            tournament_attack = historical_attack
            tournament_defense = historical_defense
            tournament_form = recent_form

        context = merged_team_context(current_state, team_id)
        context_score = (
            context["availabilityScore"] * 0.25 + context["tacticalFitScore"] * 0.22
            + context["playerFitScore"] * 0.18 + context["cohesionScore"] * 0.18
            + context["coachAdaptabilityScore"] * 0.17
        )
        current_weight = 0.0 if match_count == 0 else 0.28 if match_count == 1 else 0.38 if match_count == 2 else 0.45
        context_weight = 0.18
        history_weight = 1 - current_weight - context_weight
        ml_strength = clamp(
            historical_base * history_weight + tournament_form * current_weight + context_score * context_weight,
            28, 98,
        )
        attack_trend = clamp(historical_attack * (1 - current_weight) + tournament_attack * current_weight, 20, 98)
        defense_trend = clamp(historical_defense * (1 - current_weight) + tournament_defense * current_weight, 20, 98)
        evidence_score = min(96, 54 + match_count * 13)
        confidence = clamp(
            ml_strength * 0.34 + tournament_form * 0.20 + context_score * 0.18
            + context["cohesionScore"] * 0.12 + evidence_score * 0.16,
            35, 96,
        )
        injury_penalty = max(0, 88 - context["availabilityScore"])
        upset_index = (
            (100 - confidence) * 0.45 + (100 - context["tacticalFitScore"]) * 0.30
            + injury_penalty * 0.25
        )
        risk = "high" if upset_index >= 26 else "medium" if upset_index >= 15 else "low"
        profiles.append(
            {
                "teamId": team_id,
                "mlStrengthScore": round(ml_strength),
                "recentFormScore": round(clamp(recent_form + recent_gd * 5, 20, 98)),
                "tournamentFormScore": round(tournament_form),
                "attackTrend": round(attack_trend),
                "defenseTrend": round(defense_trend),
                "squadAvailabilityScore": round(context["availabilityScore"]),
                "tacticalFitScore": round(context["tacticalFitScore"]),
                "playerFitScore": round(context["playerFitScore"]),
                "squadCohesionScore": round(context["cohesionScore"]),
                "currentSquadSignalScore": round(squad_signals.get(team_id, 55)),
                "coachAdaptabilityScore": round(context["coachAdaptabilityScore"]),
                "currentMatchCount": match_count,
                "confidenceScore": round(confidence),
                "upsetRisk": risk,
                "keyAbsences": context["keyAbsences"],
                "keyAbsencesZh": context["keyAbsencesZh"],
                "tacticalNotes": context["tacticalNotes"],
                "tacticalNotesZh": context["tacticalNotesZh"],
                "updatedAt": current_state["snapshotAt"],
                "explanation": (
                    f"Hybrid estimate using recency-weighted international history, {match_count} current World Cup "
                    "match(es), current squad structure, availability, player-role fit, tactical fit, cohesion, and coach adaptability."
                ),
            }
        )

    profiles.sort(key=lambda item: (-item["mlStrengthScore"], -item["confidenceScore"], item["teamId"]))
    meta = {
        "modelName": f"Current-State Hybrid ({selected_model.__class__.__name__})",
        "trainedAt": current_state["snapshotAt"],
        "trainingDataCutoff": current_state.get("competitionDateCutoff", str(results["date"].max().date())),
        "dataSources": [
            "Historical international results CSV (local)",
            "Current tournament state snapshot (committed)",
            "Frozen pre-tournament team signals (committed)",
            "Recency-weighted international match history",
            "Current World Cup results through the stated cutoff",
            "Manually maintained squad availability and tactical context",
            "Projected current-squad structure and role fields",
            "Project squad-value and frozen strength fields",
        ],
        "validationAccuracy": round(validation_accuracy, 4),
        "notes": (
            f"Classifier trained on {len(results)} historical matches with exponential time decay and final-tournament "
            f"matches weighted highest. Profiles blend current tournament evidence, availability, tactical fit, "
            f"cohesion, and coach adaptability. Baseline accuracy: {baseline_accuracy:.3f}; selected accuracy: "
            f"{validation_accuracy:.3f}. Context scores are analyst estimates and should be refreshed as news changes."
        ),
    }

    output = f'''import type {{ ModelPredictionProfile, PredictionModelMeta }} from "../types/worldCup";

export const predictionModelMeta: PredictionModelMeta = {json_for_ts(meta)};

export const modelPredictionProfiles: ModelPredictionProfile[] = {json_for_ts(profiles)};
'''
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(output, encoding="utf-8")
    args.profile_json.parent.mkdir(parents=True, exist_ok=True)
    args.profile_json.write_text(
        json.dumps({"meta": meta, "profiles": profiles}, ensure_ascii=False, indent=2), encoding="utf-8",
    )
    print(f"Wrote {args.output}")
    print(f"Wrote {args.profile_json}")
    print(f"Selected model: {model_name} ({validation_accuracy:.3f} validation accuracy)")
    print(f"Current tournament results incorporated: {len(current_results)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
