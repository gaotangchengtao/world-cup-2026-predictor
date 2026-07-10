"""离线训练 2026 世界杯预测模型，并生成前端可直接读取的球队预测画像。

这段脚本负责“训练和汇总数据”，不会在网页运行时执行。主要流程是：
1. 读取历史国家队赛果、当前世界杯赛果、阵容身价和人工维护的战术情境；
2. 构造 Elo、近期状态、进失球、对手强度等特征；
3. 依次训练多个候选分类器，自动选择验证准确率最高的一个；
4. 把历史实力、本届状态和人员战术情境合成为球队画像；
5. 输出 src/data/modelPredictions.ts，供 React 前端静态展示。

完整公式和自主修改指南见项目根目录“预测模型说明与自主修改指南.txt”。
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
import unicodedata
from collections import defaultdict, deque
from pathlib import Path


# 所有默认路径都相对于项目根目录，方便在不同电脑上移动整个项目。
ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "data" / "raw" / "results.csv"
DEFAULT_CURRENT_STATE = ROOT / "data" / "current" / "world_cup_2026_state.json"
DEFAULT_BASELINE_SIGNALS = ROOT / "data" / "current" / "team_baseline_signals.json"
DEFAULT_MARKET_VALUES = ROOT / "src" / "data" / "marketValues.json"
DEFAULT_OUTPUT = ROOT / "src" / "data" / "modelPredictions.ts"
DEFAULT_PROFILE_JSON = ROOT / "outputs" / "current_model_profiles.json"
DEFAULT_MODEL_DIR = ROOT / "models"


# 同一国家在不同数据源中可能有不同英文写法，训练前先统一名称。
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
    """去除重音和符号，并把国家名转换成模型使用的统一键。"""
    text = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-zA-Z0-9]+", " ", text).strip().lower()
    return ALIASES.get(text, text)


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def tournament_weight(name: str) -> float:
    """返回赛事级别权重：世界杯正赛最重要，友谊赛影响最低。"""
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


def recency_weight(match_date, reference_date, half_life_years: float = 3.0) -> float:
    """计算时间权重：3 年半衰期、最低 1%，最近 12 个月再获得平滑加成。"""
    age_years = max(0.0, (reference_date - match_date).days / 365.25)
    base_weight = max(0.01, math.pow(0.5, age_years / half_life_years))
    recent_year_boost = 1 + 0.25 * max(0.0, 1 - age_years)
    return base_weight * recent_year_boost


def current_tournament_weight(match_count: int) -> float:
    """本届世界杯状态占比随已赛场数增加，5 场及以上达到 60%。"""
    if match_count <= 0:
        return 0.0
    if match_count == 1:
        return 0.32
    if match_count == 2:
        return 0.44
    if match_count == 3:
        return 0.52
    if match_count == 4:
        return 0.56
    return 0.60


def parse_project_teams(path: Path) -> list[dict[str, object]]:
    """从 teams.ts 提取训练需要的少量基础字段，不执行 TypeScript。"""
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


def parse_current_squad_signals(path: Path, unavailable_players: set[str]) -> dict[str, float]:
    """把名单完整度转换成 0-100 分，已确认未入选的球员会被排除。"""
    text = path.read_text(encoding="utf-8")
    rows = defaultdict(lambda: {"count": 0, "key": 0, "starters": 0, "positions": set()})
    for block in re.findall(r"\{ teamId: \"[^\"]+\".*? \},", text):
        team_match = re.search(r'teamId: "([^"]+)"', block)
        player_match = re.search(r'name: "([^"]+)"', block)
        position_match = re.search(r'position: "(GK|DF|MF|FW)"', block)
        if not team_match or not player_match or not position_match:
            continue
        if player_match.group(1) in unavailable_players:
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
        # 名单信号 = 位置覆盖 32% + 核心球员深度 24% + 首发准备度 24% + 样本覆盖 20%。
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


def build_match_features(
    home,
    away,
    match_date,
    tournament_name,
    neutral,
    competition_weight,
    sample_weight,
    elo,
    recent_points,
    recent_goal_diff,
    recent_goals_for,
    recent_goals_against,
    recent_points_5,
    recent_points_20,
    recent_goal_diff_5,
    recent_goal_diff_20,
    recent_opponent_elo,
    team_match_counts,
) -> list[float]:
    """用比赛开始前的状态构造 25 项特征，训练和逐场回测共用同一套逻辑。"""
    tournament_lower = tournament_name.lower()
    elo_home = elo[home]
    elo_away = elo[away]
    elo_gap = elo_home - elo_away
    return [
        elo_gap,
        rolling_average(recent_points[home], 1.2) - rolling_average(recent_points[away], 1.2),
        rolling_average(recent_goal_diff[home], 0) - rolling_average(recent_goal_diff[away], 0),
        rolling_average(recent_goals_for[home], 1.2) - rolling_average(recent_goals_for[away], 1.2),
        rolling_average(recent_goals_against[away], 1.2) - rolling_average(recent_goals_against[home], 1.2),
        neutral,
        0 if neutral else 1,
        competition_weight,
        sample_weight,
        elo_home,
        elo_away,
        abs(elo_gap),
        expected_score(elo_home, elo_away),
        rolling_average(recent_points_5[home], 1.2) - rolling_average(recent_points_5[away], 1.2),
        rolling_average(recent_points_20[home], 1.2) - rolling_average(recent_points_20[away], 1.2),
        rolling_average(recent_goal_diff_5[home], 0) - rolling_average(recent_goal_diff_5[away], 0),
        rolling_average(recent_goal_diff_20[home], 0) - rolling_average(recent_goal_diff_20[away], 0),
        rolling_average(recent_goals_for[home], 1.2) + rolling_average(recent_goals_for[away], 1.2),
        rolling_average(recent_goals_against[home], 1.2) + rolling_average(recent_goals_against[away], 1.2),
        rolling_average(recent_opponent_elo[home], 1500) - rolling_average(recent_opponent_elo[away], 1500),
        math.log1p(team_match_counts[home]) - math.log1p(team_match_counts[away]),
        1 if "world cup" in tournament_lower and "qualification" not in tournament_lower else 0,
        1 if "friendly" in tournament_lower else 0,
        1 if "qualification" in tournament_lower or "qualifier" in tournament_lower else 0,
        int(match_date.year),
    ]


def expected_score(elo_a: float, elo_b: float) -> float:
    """Elo 预期得分，结果在 0-1 之间；越接近 1 表示 A 队越被看好。"""
    return 1 / (1 + math.pow(10, (elo_b - elo_a) / 400))


def update_elo(elo_a: float, elo_b: float, result_a: float, weight: float) -> tuple[float, float]:
    # K 值乘上样本权重，因此近期世界杯正赛对 Elo 的影响最大。
    k = 24 * weight
    expected_a = expected_score(elo_a, elo_b)
    delta = k * (result_a - expected_a)
    return elo_a + delta, elo_b - delta


def append_result(
    home,
    away,
    home_score,
    away_score,
    weight,
    elo,
    recent_points,
    recent_goal_diff,
    recent_goals_for,
    recent_goals_against,
    recent_points_5=None,
    recent_points_20=None,
    recent_goal_diff_5=None,
    recent_goal_diff_20=None,
    recent_opponent_elo=None,
    team_match_counts=None,
) -> None:
    """按时间顺序写入一场赛果，并同步更新 Elo 和多个近期状态窗口。"""
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
    if recent_points_5 is not None:
        recent_points_5[home].append(home_points)
        recent_points_5[away].append(away_points)
    if recent_points_20 is not None:
        recent_points_20[home].append(home_points)
        recent_points_20[away].append(away_points)
    if recent_goal_diff_5 is not None:
        recent_goal_diff_5[home].append(home_score - away_score)
        recent_goal_diff_5[away].append(away_score - home_score)
    if recent_goal_diff_20 is not None:
        recent_goal_diff_20[home].append(home_score - away_score)
        recent_goal_diff_20[away].append(away_score - home_score)
    if recent_opponent_elo is not None:
        recent_opponent_elo[home].append(elo[away])
        recent_opponent_elo[away].append(elo[home])
    if team_match_counts is not None:
        team_match_counts[home] += 1
        team_match_counts[away] += 1


def merged_team_context(current_state: dict, team_id: str) -> dict:
    """合并默认情境和球队专属情境；球队专属值优先。"""
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
    # 命令行参数允许替换历史 CSV、实时快照和输出位置，默认值适合本项目直接运行。
    parser = argparse.ArgumentParser(description="Train the offline World Cup prediction model.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="Historical results CSV path.")
    parser.add_argument("--current-state", type=Path, default=DEFAULT_CURRENT_STATE, help="Current tournament state JSON.")
    parser.add_argument("--baseline-signals", type=Path, default=DEFAULT_BASELINE_SIGNALS, help="Frozen pre-tournament team signals JSON.")
    parser.add_argument("--market-values", type=Path, default=DEFAULT_MARKET_VALUES, help="Current squad and player market-value snapshot.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="TypeScript output path.")
    parser.add_argument("--profile-json", type=Path, default=DEFAULT_PROFILE_JSON, help="Machine-readable profile output.")
    parser.add_argument("--model-dir", type=Path, default=DEFAULT_MODEL_DIR, help="Optional local model artifact directory.")
    parser.add_argument(
        "--world-cup-only",
        action="store_true",
        help="Train only on FIFA World Cup final tournament matches. Qualification and future fixtures without scores are excluded.",
    )
    args = parser.parse_args()

    # 先检查所有输入文件，缺少历史 CSV 时给出提示，但不影响前端使用旧的已生成结果。
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
    if not args.market_values.exists():
        print(f"Missing market-value snapshot: {args.market_values}")
        return 1

    # 延迟导入机器学习依赖，让缺少依赖时的错误信息更容易理解。
    try:
        import joblib
        import pandas as pd
        from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier, VotingClassifier
        from sklearn.linear_model import LogisticRegression
        from sklearn.metrics import accuracy_score
        from sklearn.model_selection import train_test_split
        from sklearn.pipeline import make_pipeline
        from sklearn.preprocessing import StandardScaler
    except ImportError as exc:
        print(f"Missing Python ML dependency: {exc}")
        print("Install dependencies with: python -m pip install -r requirements-ml.txt")
        return 1

    # 冻结基础信号用于防止“上一次输出再次成为下一次输入”的反馈漂移；
    # 最新身价只覆盖身价字段，不会悄悄改写赛前实力排名。
    teams = parse_project_teams(ROOT / "src" / "data" / "teams.ts")
    if not teams:
        print("Could not parse src/data/teams.ts")
        return 1
    baseline_signals = json.loads(args.baseline_signals.read_text(encoding="utf-8")).get("teams", {})
    market_snapshot = json.loads(args.market_values.read_text(encoding="utf-8"))
    current_team_values = market_snapshot.get("teams", {})
    for team in teams:
        baseline = baseline_signals.get(str(team["id"]))
        if baseline:
            team["strengthRank"] = float(baseline["strengthRank"])
            team["strengthScore"] = float(baseline["strengthScore"])
            team["squadValueEurM"] = float(baseline.get("squadValueEurM", team["squadValueEurM"]))
        if str(team["id"]) in current_team_values:
            team["squadValueEurM"] = float(current_team_values[str(team["id"])])
    teams_by_id = {str(team["id"]): team for team in teams}
    unavailable_players = {
        name for name, row in market_snapshot.get("availability", {}).items()
        if row.get("status") == "not-selected"
    }
    squad_signals = parse_current_squad_signals(
        ROOT / "src" / "data" / "players.ts",
        unavailable_players,
    )
    current_state = json.loads(args.current_state.read_text(encoding="utf-8"))

    # 清洗历史赛果：没有比分的未来赛程、无效日期和缺少球队名的行不会进入训练。
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

    # 维护 5/10/20 场三个时间窗口，让模型同时看到短期状态和较稳定的中期趋势。
    reference_date = pd.Timestamp(current_state.get("competitionDateCutoff", results["date"].max()))
    elo = defaultdict(lambda: 1500.0)
    team_match_counts: dict[str, int] = defaultdict(int)
    recent_points_5: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=5))
    recent_points: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=10))
    recent_points_20: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=20))
    recent_goal_diff_5: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=5))
    recent_goal_diff: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=10))
    recent_goal_diff_20: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=20))
    recent_goals_for: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=10))
    recent_goals_against: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=10))
    recent_opponent_elo: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=10))
    features: list[list[float]] = []
    labels: list[int] = []
    sample_weights: list[float] = []

    # 每一行特征都只能使用该场比赛之前的信息，避免把赛果泄漏到训练输入中。
    for row in results.itertuples(index=False):
        home = normalize_name(str(row.home_team))
        away = normalize_name(str(row.away_team))
        home_score = int(row.home_score)
        away_score = int(row.away_score)
        neutral = 1 if bool(row.neutral) else 0
        competition_weight = tournament_weight(str(row.tournament))
        tournament_name = str(row.tournament)
        weight = competition_weight * recency_weight(row.date, reference_date)
        # 25 项特征覆盖 Elo、近期积分/净胜球、攻防、对手强度、场地和赛事类型。
        # 各树模型会自行学习非线性关系，因此这里没有给每项特征硬编码百分比。
        features.append(
            build_match_features(
                home, away, row.date, tournament_name, neutral, competition_weight, weight,
                elo, recent_points, recent_goal_diff, recent_goals_for, recent_goals_against,
                recent_points_5, recent_points_20, recent_goal_diff_5, recent_goal_diff_20,
                recent_opponent_elo, team_match_counts,
            )
        )
        # 三分类标签：0=主队胜，1=平局，2=客队胜。
        labels.append(0 if home_score > away_score else 1 if home_score == away_score else 2)
        sample_weights.append(weight)

        append_result(
            home,
            away,
            home_score,
            away_score,
            weight,
            elo,
            recent_points,
            recent_goal_diff,
            recent_goals_for,
            recent_goals_against,
            recent_points_5,
            recent_points_20,
            recent_goal_diff_5,
            recent_goal_diff_20,
            recent_opponent_elo,
            team_match_counts,
        )

    if len(features) < 100:
        print("Not enough historical rows to train a useful model. Provide a larger results.csv.")
        return 1

    # 按时间顺序保留最后 20% 比赛做验证，不随机打乱，更接近“用过去预测未来”。
    x_train, x_test, y_train, y_test, w_train, w_test = train_test_split(
        features,
        labels,
        sample_weights,
        test_size=0.2,
        shuffle=False,
    )
    # 同时训练线性基线、梯度提升、随机森林和软投票组合，最后自动选验证分最高者。
    model = HistGradientBoostingClassifier(
        max_iter=240, learning_rate=0.04, l2_regularization=0.15, random_state=42,
    )
    forest = RandomForestClassifier(
        n_estimators=280,
        min_samples_leaf=12,
        max_features="sqrt",
        n_jobs=-1,
        random_state=42,
    )
    ensemble = VotingClassifier(
        estimators=[
            ("rf", RandomForestClassifier(
                n_estimators=280,
                min_samples_leaf=12,
                max_features="sqrt",
                n_jobs=-1,
                random_state=42,
            )),
            ("hgb", HistGradientBoostingClassifier(
                max_iter=240,
                learning_rate=0.04,
                l2_regularization=0.15,
                random_state=42,
            )),
        ],
        voting="soft",
    )
    baseline = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
    model.fit(x_train, y_train, sample_weight=w_train)
    forest.fit(x_train, y_train, sample_weight=w_train)
    ensemble.fit(x_train, y_train, sample_weight=w_train)
    baseline.fit(x_train, y_train, logisticregression__sample_weight=w_train)
    candidate_scores = [
        ("Logistic Regression Baseline", baseline, float(accuracy_score(y_test, baseline.predict(x_test)))),
        ("HistGradientBoostingClassifier", model, float(accuracy_score(y_test, model.predict(x_test)))),
        ("RandomForestClassifier", forest, float(accuracy_score(y_test, forest.predict(x_test)))),
        ("Soft Voting Ensemble (RF + HGB)", ensemble, float(accuracy_score(y_test, ensemble.predict(x_test)))),
    ]
    # accuracy 是胜/平/负判断正确率，不等同于任意球队的单场胜率。
    model_name, selected_model, validation_accuracy = max(candidate_scores, key=lambda item: item[2])
    raw_validation_accuracy = validation_accuracy
    baseline_accuracy = candidate_scores[0][2]

    # 仅用历史时间外验证集校准“额外判为平局”的阈值，本届淘汰赛答案不参与调参。
    selected_classes = [int(label) for label in selected_model.classes_]
    draw_class_index = selected_classes.index(1)
    validation_probabilities = selected_model.predict_proba(x_test)
    draw_threshold = 0.50
    for candidate_threshold in [value / 100 for value in range(49, 19, -1)]:
        calibrated_predictions = []
        for probabilities in validation_probabilities:
            raw_label = selected_classes[max(range(len(probabilities)), key=lambda index: probabilities[index])]
            calibrated_predictions.append(
                1 if float(probabilities[draw_class_index]) >= candidate_threshold else raw_label
            )
        candidate_accuracy = float(accuracy_score(y_test, calibrated_predictions))
        if candidate_accuracy > validation_accuracy:
            validation_accuracy = candidate_accuracy
            draw_threshold = candidate_threshold

    args.model_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(selected_model, args.model_dir / "world_cup_prediction_model.joblib")

    # 历史模型训练完成后，再叠加本届世界杯真实赛果，形成“当前赛事状态”。
    tournament_stats = defaultdict(
        lambda: {"matches": 0, "points": 0, "goalsFor": 0, "goalsAgainst": 0, "opponentEloTotal": 0.0}
    )
    current_results = current_state.get("actualResults", [])
    knockout_start_date = pd.Timestamp(current_state.get("knockoutStageStartDate", "2026-06-28"))
    knockout_backtest: list[dict[str, object]] = []
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
        result_date = pd.Timestamp(result["date"])
        current_competition_weight = tournament_weight("FIFA World Cup")
        current_result_weight = current_competition_weight * recency_weight(result_date, reference_date)

        # 淘汰赛逐场回测必须在写入本场结果之前预测，确保模型看不到答案。
        if result_date >= knockout_start_date:
            match_features = build_match_features(
                home, away, result_date, "FIFA World Cup", 1,
                current_competition_weight, current_result_weight,
                elo, recent_points, recent_goal_diff, recent_goals_for, recent_goals_against,
                recent_points_5, recent_points_20, recent_goal_diff_5, recent_goal_diff_20,
                recent_opponent_elo, team_match_counts,
            )
            predicted_label = int(selected_model.predict([match_features])[0])
            probabilities = selected_model.predict_proba([match_features])[0]
            probability_by_label = {
                int(label): float(probability)
                for label, probability in zip(selected_model.classes_, probabilities)
            }
            if probability_by_label.get(1, 0.0) >= draw_threshold:
                predicted_label = 1
            actual_label = 0 if home_score > away_score else 1 if home_score == away_score else 2
            label_names = {0: "home-win", 1: "draw", 2: "away-win"}
            knockout_backtest.append(
                {
                    "date": str(result["date"]),
                    "homeTeamId": home_id,
                    "awayTeamId": away_id,
                    "predictedResult": label_names[predicted_label],
                    "actualResult": label_names[actual_label],
                    "correct": predicted_label == actual_label,
                    "confidence": round(float(max(probabilities)), 4),
                    "homeWinProbability": round(probability_by_label.get(0, 0.0), 4),
                    "drawProbability": round(probability_by_label.get(1, 0.0), 4),
                    "awayWinProbability": round(probability_by_label.get(2, 0.0), 4),
                }
            )

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
        # 当前世界杯赛果同时享受最高赛事权重和最近一年加成，确保其最能推动最新 Elo。
        append_result(
            home, away, home_score, away_score, current_result_weight, elo,
            recent_points, recent_goal_diff, recent_goals_for, recent_goals_against,
            recent_points_5, recent_points_20, recent_goal_diff_5, recent_goal_diff_20,
            recent_opponent_elo, team_match_counts,
        )

    knockout_correct = sum(1 for row in knockout_backtest if row["correct"])
    knockout_accuracy = knockout_correct / len(knockout_backtest) if knockout_backtest else None

    project_elos = [elo[str(team["normalized"])] for team in teams]
    min_elo, max_elo = min(project_elos), max(project_elos)
    profiles = []

    # 为 48 支球队生成前端画像。下面这些固定占比可以按需要自主调整。
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
        # 历史基础分：项目基础分 14%、Elo 22%、近期状态 18%、攻防各 10%、
        # 身价 10%、实力排名 10%、名单结构 6%。
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
            # 本届状态：场均积分 42%、净胜球 28%、进攻 13%、防守 12%、对手强度 5%。
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
        # 人员战术情境：可用性 25%、战术 22%、角色适配 18%、默契 18%、教练 17%。
        context_score = (
            context["availabilityScore"] * 0.25 + context["tacticalFitScore"] * 0.22
            + context["playerFitScore"] * 0.18 + context["cohesionScore"] * 0.18
            + context["coachAdaptabilityScore"] * 0.17
        )
        # 本届状态占比：1/2/3/4/5+ 场分别为 32%/44%/52%/56%/60%。
        current_weight = current_tournament_weight(match_count)
        context_weight = 0.18
        history_weight = 1 - current_weight - context_weight
        ml_strength = clamp(
            historical_base * history_weight + tournament_form * current_weight + context_score * context_weight,
            28, 98,
        )
        attack_trend = clamp(historical_attack * (1 - current_weight) + tournament_attack * current_weight, 20, 98)
        defense_trend = clamp(historical_defense * (1 - current_weight) + tournament_defense * current_weight, 20, 98)
        evidence_score = min(96, 54 + match_count * 13)
        # 置信度还考虑证据量；参赛场次越多，模型越少依赖赛前假设。
        confidence = clamp(
            ml_strength * 0.34 + tournament_form * 0.20 + context_score * 0.18
            + context["cohesionScore"] * 0.12 + evidence_score * 0.16,
            35, 96,
        )
        injury_penalty = max(0, 88 - context["availabilityScore"])
        # 低置信度、低战术适配和伤停会共同提高爆冷风险。
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
    candidate_score_text = ", ".join(f"{name}: {score:.3f}" for name, _, score in candidate_scores)
    knockout_summary = (
        f"{knockout_correct}/{len(knockout_backtest)} correct ({knockout_accuracy:.3f})"
        if knockout_accuracy is not None
        else "not available"
    )
    meta = {
        "modelName": f"Current-State Hybrid ({model_name})",
        "trainedAt": current_state["snapshotAt"],
        "trainingDataCutoff": current_state.get("competitionDateCutoff", str(results["date"].max().date())),
        "dataSources": [
            "Historical international results CSV (local)",
            "Current tournament state snapshot (committed)",
            "Frozen pre-tournament team signals (committed)",
            "Recency-weighted international match history",
            "Current World Cup results through the stated cutoff",
            "Expanded Elo, form-window, opponent-strength, experience, and match-type features",
            "Manually maintained squad availability and tactical context",
            "Projected current-squad structure and role fields",
            "Current public squad-value snapshot and frozen strength fields",
        ],
        "validationAccuracy": round(validation_accuracy, 4),
        "rawValidationAccuracy": round(raw_validation_accuracy, 4),
        "drawCalibrationThreshold": draw_threshold,
        "knockoutValidationAccuracy": round(knockout_accuracy, 4) if knockout_accuracy is not None else None,
        "knockoutValidationMatches": len(knockout_backtest),
        "knockoutValidationCorrect": knockout_correct,
        "knockoutValidationStartDate": str(knockout_start_date.date()),
        "knockoutValidationMethod": "Sequential pre-match 1X2 holdout; each result is appended only after its prediction.",
        "notes": (
            f"Classifier trained on {len(results)} historical matches with exponential time decay and final-tournament "
            f"matches weighted highest. The match model now uses {len(features[0])} features, including multiple "
            f"recent-form windows, Elo level and expected score, opponent strength, team experience, match type, "
            f"and recency weight. Candidate validation scores: {candidate_score_text}. Profiles blend current "
            f"tournament evidence, availability, tactical fit, cohesion, and coach adaptability. Baseline accuracy: "
            f"{baseline_accuracy:.3f}; raw selected accuracy: {raw_validation_accuracy:.3f}; draw-calibrated "
            f"accuracy: {validation_accuracy:.3f} at threshold {draw_threshold:.2f}. Strict current-knockout "
            f"backtest: {knockout_summary}. Context scores are analyst estimates and should be refreshed as news changes."
        ),
    }

    # modelPredictions.ts 是自动生成文件，不应手改；改完权重后重新运行本脚本即可覆盖。
    output = f'''import type {{ ModelPredictionProfile, PredictionModelMeta }} from "../types/worldCup";

export const predictionModelMeta: PredictionModelMeta = {json_for_ts(meta)};

export const modelPredictionProfiles: ModelPredictionProfile[] = {json_for_ts(profiles)};
'''
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(output, encoding="utf-8")
    args.profile_json.parent.mkdir(parents=True, exist_ok=True)
    args.profile_json.write_text(
        json.dumps(
            {"meta": meta, "profiles": profiles, "knockoutBacktest": knockout_backtest},
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Wrote {args.output}")
    print(f"Wrote {args.profile_json}")
    print(
        f"Selected model: {model_name} ({raw_validation_accuracy:.3f} raw, "
        f"{validation_accuracy:.3f} draw-calibrated validation accuracy)"
    )
    print(f"Draw calibration threshold: {draw_threshold:.2f}")
    print(f"Current tournament results incorporated: {len(current_results)}")
    if knockout_accuracy is not None:
        print(
            f"Strict knockout backtest: {knockout_correct}/{len(knockout_backtest)} "
            f"({knockout_accuracy:.3f} 1X2 accuracy)"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
