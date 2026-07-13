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
from datetime import date
from pathlib import Path


# 所有默认路径都相对于项目根目录，方便在不同电脑上移动整个项目。
ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "data" / "raw" / "results.csv"
DEFAULT_CURRENT_STATE = ROOT / "data" / "current" / "world_cup_2026_state.json"
DEFAULT_CURRENT_RESULTS = ROOT / "data" / "current" / "world_cup_2026_results.json"
DEFAULT_VENUES = ROOT / "data" / "current" / "world_cup_2026_venues.json"
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


def pre_tournament_prior_score(team: dict[str, object]) -> float:
    """用赛前已冻结的实力、排名和阵容身价构造稳定先验，不读取本届赛果。"""
    rank_score = clamp(102 - float(team["strengthRank"]) * 1.35, 25, 98)
    # 回测必须读取赛前冻结身价；当前身价可能已受本届比赛表现影响，只用于最新页面资料。
    squad_value = float(team.get("preTournamentSquadValueEurM", team["squadValueEurM"]))
    value_score = math.log10(max(1, squad_value)) / math.log10(1300) * 100
    return (
        float(team["strengthScore"]) * 0.55
        + rank_score * 0.25
        + value_score * 0.20
    )


def pre_match_tournament_form(stats: dict[str, float], fallback: float) -> float:
    """只用当前比赛之前已经结束的本届赛事，计算球队即时状态。"""
    match_count = int(stats["matches"])
    if match_count <= 0:
        return fallback
    points_per_game = float(stats["points"]) / match_count
    goals_for_per_game = float(stats["goalsFor"]) / match_count
    goals_against_per_game = float(stats["goalsAgainst"]) / match_count
    goal_difference_per_game = goals_for_per_game - goals_against_per_game
    attack_score = clamp(28 + goals_for_per_game * 22, 20, 98)
    defense_score = clamp(96 - goals_against_per_game * 28, 20, 98)
    return clamp(
        (points_per_game / 3 * 100) * 0.42
        + clamp(50 + goal_difference_per_game * 16, 15, 98) * 0.28
        + attack_score * 0.15
        + defense_score * 0.15,
        20,
        98,
    )


def haversine_distance_km(venue_a: dict, venue_b: dict) -> float:
    """按两个场馆经纬度估算球队换城市后的直线旅行距离。"""
    latitude_a = math.radians(float(venue_a["latitude"]))
    latitude_b = math.radians(float(venue_b["latitude"]))
    latitude_delta = math.radians(float(venue_b["latitude"]) - float(venue_a["latitude"]))
    longitude_delta = math.radians(float(venue_b["longitude"]) - float(venue_a["longitude"]))
    haversine = (
        math.sin(latitude_delta / 2) ** 2
        + math.cos(latitude_a) * math.cos(latitude_b) * math.sin(longitude_delta / 2) ** 2
    )
    return 6371 * 2 * math.asin(math.sqrt(haversine))


def pre_match_environment_readiness(
    team_id: str,
    match: dict,
    previous_match_by_team: dict[str, dict],
    venues_by_id: dict[str, dict],
) -> dict[str, float]:
    """估算赛前环境与疲劳准备度；只使用赛程、场馆常量和此前比赛路径。

    温湿度采用七月气候基线，而非赛后观测值。由于这类估算噪声较大，
    它在最终晋级评分中只占 1%，主要用于小幅修正概率和风险提示。
    """
    current_venue = venues_by_id.get(str(match.get("venueId", "")))
    previous_match = previous_match_by_team.get(team_id)
    if not current_venue or not previous_match:
        return {
            "score": 65.0,
            "restDays": 4.0,
            "travelDistanceKm": 0.0,
            "climateTransition": 0.0,
            "temperatureC": float(current_venue.get("julyDaytimeTemperatureC", 26)) if current_venue else 26.0,
            "humidityPct": float(current_venue.get("julyRelativeHumidityPct", 55)) if current_venue else 55.0,
            "altitudeM": float(current_venue.get("altitudeM", 0)) if current_venue else 0.0,
        }

    previous_venue = venues_by_id.get(str(previous_match.get("venueId", "")))
    if not previous_venue:
        previous_venue = current_venue
    current_date = match["parsedDate"]
    rest_days = max(1, int((current_date - previous_match["parsedDate"]).days))
    travel_distance = haversine_distance_km(previous_venue, current_venue)
    climate_transition = (
        abs(float(current_venue["julyDaytimeTemperatureC"]) - float(previous_venue["julyDaytimeTemperatureC"])) * 3
        + abs(float(current_venue["julyRelativeHumidityPct"]) - float(previous_venue["julyRelativeHumidityPct"])) * 0.35
        + abs(float(current_venue["altitudeM"]) - float(previous_venue["altitudeM"])) / 45
    )
    climate_protection = {
        "open": 0.0,
        "open-canopy": 0.20,
        "fixed-canopy": 0.55,
        "retractable": 0.55,
    }.get(str(current_venue.get("roofType", "open")), 0.0)
    effective_temperature = 22 + (
        float(current_venue["julyDaytimeTemperatureC"]) - 22
    ) * (1 - climate_protection)
    effective_humidity = 50 + (
        float(current_venue["julyRelativeHumidityPct"]) - 50
    ) * (1 - climate_protection)
    heat_load = max(0, effective_temperature - 27) * 4 + max(0, effective_humidity - 62) * 0.45
    readiness = clamp(
        clamp(50 + (rest_days - 3.5) * 10, 20, 90) * 0.42
        + clamp(100 - travel_distance / 25, 20, 100) * 0.25
        + clamp(100 - climate_transition, 20, 100) * 0.23
        + clamp(100 - heat_load, 35, 100) * 0.10,
        20,
        98,
    )
    return {
        "score": readiness,
        "restDays": float(rest_days),
        "travelDistanceKm": travel_distance,
        "climateTransition": climate_transition,
        "temperatureC": float(current_venue["julyDaytimeTemperatureC"]),
        "humidityPct": float(current_venue["julyRelativeHumidityPct"]),
        "altitudeM": float(current_venue["altitudeM"]),
    }


def advancement_scores(record: dict, weights: dict[str, float]) -> tuple[float, float]:
    """用同一组全局权重计算双方晋级评分，不包含任何球队或单场特例。"""
    home_score = (
        float(record["homePrior"]) * weights["prior"]
        + float(record["homeTournamentForm"]) * weights["form"]
        + float(record["homeClassifierAdvance"]) * weights["classifier"]
        + float(record["homeEnvironmentReadiness"]) * weights["environment"]
    )
    away_score = (
        float(record["awayPrior"]) * weights["prior"]
        + float(record["awayTournamentForm"]) * weights["form"]
        + float(record["awayClassifierAdvance"]) * weights["classifier"]
        + float(record["awayEnvironmentReadiness"]) * weights["environment"]
    )
    return home_score, away_score


def poisson_probability(expected_goals: float, goals: int) -> float:
    """计算泊松进球概率；expected_goals 是模型给出的平均进球数。"""
    expected_goals = max(0.01, float(expected_goals))
    return math.exp(-expected_goals) * math.pow(expected_goals, goals) / math.factorial(goals)


def most_likely_scoreline(
    expected_home_goals: float,
    expected_away_goals: float,
    outcome_label: int | None = None,
    max_goals: int = 7,
) -> tuple[int, int]:
    """从泊松比分矩阵中选择概率最高的比分，并可要求它符合胜/平/负方向。"""
    best_score = (0, 0)
    best_probability = -1.0
    for home_goals in range(max_goals + 1):
        for away_goals in range(max_goals + 1):
            label = 0 if home_goals > away_goals else 1 if home_goals == away_goals else 2
            if outcome_label is not None and label != outcome_label:
                continue
            probability = (
                poisson_probability(expected_home_goals, home_goals)
                * poisson_probability(expected_away_goals, away_goals)
            )
            if probability > best_probability:
                best_score = (home_goals, away_goals)
                best_probability = probability
    return best_score


def build_knockout_score_prediction(
    expected_home_goals: float,
    expected_away_goals: float,
    regulation_outcome_label: int,
    home_environment_readiness: float = 65.0,
    away_environment_readiness: float = 65.0,
) -> dict[str, object]:
    """生成 90 分钟和加时后的比分；点球大战永远不写进比分。

    先用胜/平/负分类方向约束 90 分钟泊松比分。若预测为平局，再把 30 分钟加时
    按较低比赛节奏和双方赛前环境准备度单独建模。加时后仍平局时，只标记为
    penalties，最终比分保持 120 分钟结束时的平局。
    """
    expected_home_goals = clamp(float(expected_home_goals), 0.15, 4.5)
    expected_away_goals = clamp(float(expected_away_goals), 0.15, 4.5)
    regulation_home, regulation_away = most_likely_scoreline(
        expected_home_goals,
        expected_away_goals,
        regulation_outcome_label,
    )
    extra_home = 0
    extra_away = 0
    extra_time_played = regulation_home == regulation_away
    decided_by = "regulation"

    if extra_time_played:
        # 加时只有常规时间的三分之一，且总体节奏通常更低；准备度只做小幅修正。
        home_readiness_factor = clamp(0.78 + home_environment_readiness / 350, 0.84, 1.05)
        away_readiness_factor = clamp(0.78 + away_environment_readiness / 350, 0.84, 1.05)
        extra_home_expected = expected_home_goals / 3 * 0.78 * home_readiness_factor
        extra_away_expected = expected_away_goals / 3 * 0.78 * away_readiness_factor
        extra_home, extra_away = most_likely_scoreline(
            extra_home_expected,
            extra_away_expected,
            outcome_label=None,
            max_goals=3,
        )
        decided_by = "extra-time" if extra_home != extra_away else "penalties"

    final_home = regulation_home + extra_home
    final_away = regulation_away + extra_away
    return {
        "expectedTeamAGoals90": round(expected_home_goals, 2),
        "expectedTeamBGoals90": round(expected_away_goals, 2),
        "regulationTeamAScore": regulation_home,
        "regulationTeamBScore": regulation_away,
        "extraTimeTeamAScore": extra_home,
        "extraTimeTeamBScore": extra_away,
        "finalTeamAScore": final_home,
        "finalTeamBScore": final_away,
        "extraTimePlayed": extra_time_played,
        "decidedBy": decided_by,
    }


def calibrated_expected_goals(
    record: dict,
    parameters: dict[str, float],
) -> tuple[float, float]:
    """用一套全局参数融合历史进球模型与本届赛事实时攻防数据。"""
    history_weight = parameters["history"]
    pace_weight = parameters["pace"]
    current_weight = 1 - history_weight - pace_weight
    attack_share = parameters["attackShare"]
    recent_match_weight = parameters.get("recentMatchWeight", 0.0)
    scale = parameters["scale"]
    environment_adjustment = parameters["environmentAdjustment"]
    group_calibration_weight = parameters.get("groupCalibrationWeight", 0.0)

    home_full_tournament_signal = (
        float(record["homeTournamentAttackRate"]) * attack_share
        + float(record["awayTournamentDefenseRate"]) * (1 - attack_share)
    )
    away_full_tournament_signal = (
        float(record["awayTournamentAttackRate"]) * attack_share
        + float(record["homeTournamentDefenseRate"]) * (1 - attack_share)
    )
    home_recent_signal = (
        float(record.get("homeRecentAttackRate", record["homeTournamentAttackRate"])) * attack_share
        + float(record.get("awayRecentDefenseRate", record["awayTournamentDefenseRate"]))
        * (1 - attack_share)
    )
    away_recent_signal = (
        float(record.get("awayRecentAttackRate", record["awayTournamentAttackRate"])) * attack_share
        + float(record.get("homeRecentDefenseRate", record["homeTournamentDefenseRate"]))
        * (1 - attack_share)
    )
    home_current_signal = (
        home_full_tournament_signal * (1 - recent_match_weight)
        + home_recent_signal * recent_match_weight
    )
    away_current_signal = (
        away_full_tournament_signal * (1 - recent_match_weight)
        + away_recent_signal * recent_match_weight
    )
    pace = float(record["tournamentPaceGoalsPerTeam"])
    home_environment_factor = clamp(
        1 + (float(record["homeEnvironmentReadiness"]) - 65) * environment_adjustment,
        0.90,
        1.06,
    )
    away_environment_factor = clamp(
        1 + (float(record["awayEnvironmentReadiness"]) - 65) * environment_adjustment,
        0.90,
        1.06,
    )
    home_expected = (
        float(record["baseExpectedHomeGoals"]) * history_weight
        + home_current_signal * current_weight
        + pace * pace_weight
    ) * scale * home_environment_factor
    away_expected = (
        float(record["baseExpectedAwayGoals"]) * history_weight
        + away_current_signal * current_weight
        + pace * pace_weight
    ) * scale * away_environment_factor
    if "groupCalibratedExpectedHomeGoals" in record:
        home_expected = (
            home_expected * (1 - group_calibration_weight)
            + float(record["groupCalibratedExpectedHomeGoals"]) * group_calibration_weight
        )
    if "groupCalibratedExpectedAwayGoals" in record:
        away_expected = (
            away_expected * (1 - group_calibration_weight)
            + float(record["groupCalibratedExpectedAwayGoals"]) * group_calibration_weight
        )
    return clamp(home_expected, 0.15, 4.5), clamp(away_expected, 0.15, 4.5)


def tournament_score_calibration_features(record: dict) -> list[float]:
    """构造只依赖赛前信息的本届赛事进球校准特征。"""
    return [
        float(record["baseExpectedHomeGoals"]),
        float(record["baseExpectedAwayGoals"]),
        float(record["homeTournamentAttackRate"]),
        float(record["homeTournamentDefenseRate"]),
        float(record["awayTournamentAttackRate"]),
        float(record["awayTournamentDefenseRate"]),
        float(record["homeRecentAttackRate"]),
        float(record["homeRecentDefenseRate"]),
        float(record["awayRecentAttackRate"]),
        float(record["awayRecentDefenseRate"]),
        float(record["tournamentPaceGoalsPerTeam"]),
        (float(record["homePrior"]) - float(record["awayPrior"])) / 20,
        (float(record["homeTournamentForm"]) - float(record["awayTournamentForm"])) / 20,
        (float(record["homeEnvironmentReadiness"]) - float(record["awayEnvironmentReadiness"])) / 20,
        min(6, int(record["homeTournamentMatchCount"])) / 6,
        min(6, int(record["awayTournamentMatchCount"])) / 6,
    ]


def validate_current_tournament_data(
    results_snapshot: dict,
    venue_snapshot: dict,
    valid_team_ids: set[str],
) -> list[str]:
    """训练前检查实时赛果的完整性、一致性和时间边界。"""
    errors: list[str] = []
    matches = results_snapshot.get("matches", [])
    scheduled_matches = results_snapshot.get("scheduledMatches", [])
    cutoff = date.fromisoformat(str(results_snapshot["competitionDateCutoff"]))
    venue_ids = {str(venue["id"]) for venue in venue_snapshot.get("venues", [])}
    seen_match_numbers: set[int] = set()

    if int(results_snapshot.get("matchCount", -1)) != len(matches):
        errors.append(
            f"matchCount={results_snapshot.get('matchCount')} but matches contains {len(matches)} rows"
        )

    for match in matches:
        match_number = int(match.get("matchNumber", 0))
        if match_number in seen_match_numbers:
            errors.append(f"duplicate completed matchNumber: {match_number}")
        seen_match_numbers.add(match_number)
        home_id = str(match.get("homeTeamId", ""))
        away_id = str(match.get("awayTeamId", ""))
        if home_id not in valid_team_ids or away_id not in valid_team_ids:
            errors.append(f"match {match_number} contains an unknown team: {home_id} vs {away_id}")
        if str(match.get("venueId", "")) not in venue_ids:
            errors.append(f"match {match_number} contains an unknown venueId: {match.get('venueId')}")
        match_date = date.fromisoformat(str(match["date"]))
        if match_date > cutoff:
            errors.append(f"match {match_number} is dated after the competition cutoff")
        home_score = int(match["homeScore"])
        away_score = int(match["awayScore"])
        if home_score < 0 or away_score < 0:
            errors.append(f"match {match_number} contains a negative score")
        stage = str(match.get("stage", ""))
        if stage != "group-stage":
            winner_id = str(match.get("winnerTeamId", ""))
            if winner_id not in {home_id, away_id}:
                errors.append(f"knockout match {match_number} is missing a legal winnerTeamId")
            if home_score > away_score and winner_id != home_id:
                errors.append(f"match {match_number} score and winnerTeamId disagree")
            if away_score > home_score and winner_id != away_id:
                errors.append(f"match {match_number} score and winnerTeamId disagree")

    for match in scheduled_matches:
        match_number = int(match.get("matchNumber", 0))
        if match_number in seen_match_numbers:
            errors.append(f"scheduled matchNumber {match_number} duplicates a completed match")
        seen_match_numbers.add(match_number)
        if "homeScore" in match or "awayScore" in match or "winnerTeamId" in match:
            errors.append(f"scheduled match {match_number} already contains a result")
        if date.fromisoformat(str(match["date"])) <= cutoff:
            errors.append(f"scheduled match {match_number} is not later than the result cutoff")
        if str(match.get("venueId", "")) not in venue_ids:
            errors.append(f"scheduled match {match_number} contains an unknown venueId")

    return errors


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
    parser.add_argument("--current-results", type=Path, default=DEFAULT_CURRENT_RESULTS, help="Verified 2026 tournament results JSON.")
    parser.add_argument("--venues", type=Path, default=DEFAULT_VENUES, help="Schedule-known venue and climate baseline JSON.")
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
    if not args.current_results.exists():
        print(f"Missing current tournament results: {args.current_results}")
        return 1
    if not args.venues.exists():
        print(f"Missing venue context: {args.venues}")
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
        from sklearn.ensemble import (
            HistGradientBoostingClassifier,
            HistGradientBoostingRegressor,
            RandomForestClassifier,
            VotingClassifier,
        )
        from sklearn.linear_model import LogisticRegression, PoissonRegressor
        from sklearn.metrics import accuracy_score, mean_absolute_error, mean_poisson_deviance
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
            team["preTournamentSquadValueEurM"] = float(
                baseline.get("squadValueEurM", team["squadValueEurM"])
            )
        else:
            team["preTournamentSquadValueEurM"] = float(team["squadValueEurM"])
        if str(team["id"]) in current_team_values:
            # 最新身价保留给当前球队画像；赛前先验仍读取上面的冻结字段。
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
    current_results_snapshot = json.loads(args.current_results.read_text(encoding="utf-8"))
    venue_snapshot = json.loads(args.venues.read_text(encoding="utf-8"))
    current_data_errors = validate_current_tournament_data(
        current_results_snapshot,
        venue_snapshot,
        set(teams_by_id),
    )
    if current_data_errors:
        print("Current tournament data validation failed:")
        for error in current_data_errors:
            print(f"- {error}")
        return 1

    # 清洗历史赛果：没有比分的未来赛程、无效日期和缺少球队名的行不会进入训练。
    results = pd.read_csv(args.input)
    required = {"date", "home_team", "away_team", "home_score", "away_score", "tournament", "neutral"}
    missing = required.difference(results.columns)
    if missing:
        print(f"Historical CSV is missing required columns: {', '.join(sorted(missing))}")
        return 1

    current_tournament_dates = [
        pd.Timestamp(match["date"])
        for match in current_results_snapshot.get("matches", [])
    ]
    if not current_tournament_dates:
        print("Current tournament results contain no completed matches.")
        return 1
    current_tournament_start = min(current_tournament_dates)
    results["date"] = pd.to_datetime(results["date"], errors="coerce")
    source_rows_on_or_after_start = int(
        (results["date"] >= current_tournament_start).sum()
    )
    results = results.dropna(subset=["date", "home_team", "away_team", "home_score", "away_score"])
    if args.world_cup_only:
        results = results[results["tournament"].eq("FIFA World Cup")]
    results = results.dropna(subset=["date"]).sort_values("date")
    scored_rows_on_or_after_start = int(
        (results["date"] >= current_tournament_start).sum()
    )
    # 实时赛果文件负责完整回放本届世界杯。历史 CSV 在开赛日前截断，避免同一场比赛
    # 同时从 CSV 和实时快照进入状态，造成近期表现、Elo 与进球数据被重复累计。
    results = results[results["date"] < current_tournament_start].copy()
    if results.empty:
        print("No scored matches were available after filtering.")
        return 1
    if source_rows_on_or_after_start:
        print(
            f"Historical CSV contains {source_rows_on_or_after_start} row(s) on/after "
            f"{current_tournament_start.date()}; {scored_rows_on_or_after_start} had scores. "
            "All were excluded from historical training."
        )

    # 维护 5/10/20 场三个时间窗口，让模型同时看到短期状态和较稳定的中期趋势。
    reference_date = pd.Timestamp(
        current_results_snapshot.get(
            "competitionDateCutoff",
            current_state.get("competitionDateCutoff", results["date"].max()),
        )
    )
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
    home_goal_targets: list[int] = []
    away_goal_targets: list[int] = []
    sample_weights: list[float] = []
    score_recency_half_lives = [1.0, 1.5, 2.0, 3.0, 5.0]
    score_sample_weights_by_half_life: dict[float, list[float]] = {
        half_life: [] for half_life in score_recency_half_lives
    }

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
        home_goal_targets.append(home_score)
        away_goal_targets.append(away_score)
        sample_weights.append(weight)
        for half_life in score_recency_half_lives:
            score_sample_weights_by_half_life[half_life].append(
                competition_weight * recency_weight(row.date, reference_date, half_life)
            )

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
    (
        x_train,
        x_test,
        y_train,
        y_test,
        home_goals_train,
        home_goals_test,
        away_goals_train,
        away_goals_test,
        w_train,
        w_test,
    ) = train_test_split(
        features,
        labels,
        home_goal_targets,
        away_goal_targets,
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
    def make_goal_model(random_state: int):
        """创建进球回归器；候选时间尺度必须使用完全相同的模型结构。"""
        return HistGradientBoostingRegressor(
            loss="poisson",
            max_iter=220,
            learning_rate=0.04,
            l2_regularization=0.2,
            random_state=random_state,
        )

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

    calibrated_validation_labels: list[int] = []
    for probabilities in validation_probabilities:
        raw_label = selected_classes[max(range(len(probabilities)), key=lambda index: probabilities[index])]
        calibrated_validation_labels.append(
            1 if float(probabilities[draw_class_index]) >= draw_threshold else raw_label
        )
    # 进球模型单独搜索时间衰减尺度。候选模型结构和训练样本完全相同，只改变历史样本权重；
    # 选择过程只看本届开赛前的时间外验证集，不接触任何 2026 世界杯赛果。
    score_recency_candidates: list[dict[str, float | int]] = []
    score_recency_models: dict[float, tuple[object, object]] = {}
    for half_life in score_recency_half_lives:
        home_candidate = make_goal_model(42)
        away_candidate = make_goal_model(43)
        candidate_train_weights = score_sample_weights_by_half_life[half_life][
            :len(x_train)
        ]
        home_candidate.fit(
            x_train,
            [min(8, value) for value in home_goals_train],
            sample_weight=candidate_train_weights,
        )
        away_candidate.fit(
            x_train,
            [min(8, value) for value in away_goals_train],
            sample_weight=candidate_train_weights,
        )
        candidate_home_expected = [
            clamp(float(value), 0.15, 4.5)
            for value in home_candidate.predict(x_test)
        ]
        candidate_away_expected = [
            clamp(float(value), 0.15, 4.5)
            for value in away_candidate.predict(x_test)
        ]
        candidate_mae = (
            float(mean_absolute_error(home_goals_test, candidate_home_expected))
            + float(mean_absolute_error(away_goals_test, candidate_away_expected))
        ) / 2
        candidate_deviance = (
            float(mean_poisson_deviance(home_goals_test, candidate_home_expected))
            + float(mean_poisson_deviance(away_goals_test, candidate_away_expected))
        ) / 2
        candidate_exact = 0
        for expected_home, expected_away, outcome_label, actual_home, actual_away in zip(
            candidate_home_expected,
            candidate_away_expected,
            calibrated_validation_labels,
            home_goals_test,
            away_goals_test,
        ):
            predicted_home, predicted_away = most_likely_scoreline(
                expected_home,
                expected_away,
                outcome_label,
            )
            candidate_exact += int(
                predicted_home == actual_home and predicted_away == actual_away
            )
        score_recency_candidates.append(
            {
                "halfLifeYears": half_life,
                "validationMae": candidate_mae,
                "validationPoissonDeviance": candidate_deviance,
                "validationExactCorrect": candidate_exact,
            }
        )
        score_recency_models[half_life] = (home_candidate, away_candidate)

    selected_score_recency = min(
        score_recency_candidates,
        key=lambda item: (
            float(item["validationPoissonDeviance"]),
            float(item["validationMae"]),
            -int(item["validationExactCorrect"]),
            abs(float(item["halfLifeYears"]) - 2.0),
        ),
    )
    selected_score_half_life = float(selected_score_recency["halfLifeYears"])
    home_goal_model, away_goal_model = score_recency_models[selected_score_half_life]
    historical_score_validation_mae = float(selected_score_recency["validationMae"])
    historical_score_validation_deviance = float(
        selected_score_recency["validationPoissonDeviance"]
    )
    historical_exact_score_correct = int(selected_score_recency["validationExactCorrect"])
    historical_exact_score_accuracy = historical_exact_score_correct / len(home_goals_test)

    # 时间外验证只负责选模型和校准平局阈值。选型完成后，用全部“本届开赛前”历史样本
    # 重新拟合最终分类器，让最近一年比赛也真正参与当前预测，同时不接触本届赛果。
    if model_name == "Logistic Regression Baseline":
        selected_model.fit(
            features,
            labels,
            logisticregression__sample_weight=sample_weights,
        )
    else:
        selected_model.fit(features, labels, sample_weight=sample_weights)
    home_goal_model.fit(
        features,
        [min(8, value) for value in home_goal_targets],
        sample_weight=score_sample_weights_by_half_life[selected_score_half_life],
    )
    away_goal_model.fit(
        features,
        [min(8, value) for value in away_goal_targets],
        sample_weight=score_sample_weights_by_half_life[selected_score_half_life],
    )

    args.model_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(selected_model, args.model_dir / "world_cup_prediction_model.joblib")
    joblib.dump(
        {"homeGoalModel": home_goal_model, "awayGoalModel": away_goal_model},
        args.model_dir / "world_cup_score_models.joblib",
    )

    # 历史模型训练完成后，再按真实时间顺序叠加本届世界杯赛果。
    # 淘汰赛回测会先保存赛前特征，再写入本场结果，保证没有未来信息。
    tournament_stats = defaultdict(
        lambda: {
            "matches": 0,
            "points": 0,
            "goalsFor": 0,
            "goalsAgainst": 0,
            "opponentEloTotal": 0.0,
            "recentGoalsFor": deque(maxlen=3),
            "recentGoalsAgainst": deque(maxlen=3),
        }
    )
    tournament_matches_completed = 0
    tournament_total_goals = 0
    current_results = current_results_snapshot.get("matches", [])
    knockout_start_date = pd.Timestamp(current_state.get("knockoutStageStartDate", "2026-06-28"))
    advancement_holdout_start = pd.Timestamp(
        current_results_snapshot.get("advancementHoldoutStartDate", "2026-07-09")
    )
    venues_by_id = {
        str(venue["id"]): venue
        for venue in venue_snapshot.get("venues", [])
    }
    previous_match_by_team: dict[str, dict] = {}
    group_score_calibration_rows: list[dict[str, object]] = []
    knockout_backtest: list[dict[str, object]] = []
    for result in sorted(current_results, key=lambda item: (item["date"], int(item.get("matchNumber", 0)))):
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
        match_context = {**result, "parsedDate": result_date}
        current_competition_weight = tournament_weight("FIFA World Cup")
        current_result_weight = current_competition_weight * recency_weight(result_date, reference_date)

        stage = str(result.get("stage", ""))
        is_knockout = stage in {"round-of-32", "round-of-16", "quarter-finals", "semi-finals", "final"}
        # 小组赛只用于训练“本届赛事进球校准器”。每行特征都在本场结果写入状态之前生成，
        # 因而不会把本场比分或之后比赛的信息泄漏给模型。
        if stage == "group-stage":
            group_match_features = build_match_features(
                home, away, result_date, "FIFA World Cup", 1,
                current_competition_weight, current_result_weight,
                elo, recent_points, recent_goal_diff, recent_goals_for, recent_goals_against,
                recent_points_5, recent_points_20, recent_goal_diff_5, recent_goal_diff_20,
                recent_opponent_elo, team_match_counts,
            )
            group_predicted_label = int(selected_model.predict([group_match_features])[0])
            group_probabilities = selected_model.predict_proba([group_match_features])[0]
            group_probability_by_label = {
                int(label): float(probability)
                for label, probability in zip(selected_model.classes_, group_probabilities)
            }
            if group_probability_by_label.get(1, 0.0) >= draw_threshold:
                group_predicted_label = 1
            group_expected_home_goals = clamp(
                float(home_goal_model.predict([group_match_features])[0]),
                0.15,
                4.5,
            )
            group_expected_away_goals = clamp(
                float(away_goal_model.predict([group_match_features])[0]),
                0.15,
                4.5,
            )
            group_home_environment = pre_match_environment_readiness(
                home_id, match_context, previous_match_by_team, venues_by_id,
            )
            group_away_environment = pre_match_environment_readiness(
                away_id, match_context, previous_match_by_team, venues_by_id,
            )
            group_home_prior = pre_tournament_prior_score(teams_by_id[home_id])
            group_away_prior = pre_tournament_prior_score(teams_by_id[away_id])
            group_home_form = pre_match_tournament_form(
                tournament_stats[home_id], group_home_prior,
            )
            group_away_form = pre_match_tournament_form(
                tournament_stats[away_id], group_away_prior,
            )
            group_home_match_count = int(tournament_stats[home_id]["matches"])
            group_away_match_count = int(tournament_stats[away_id]["matches"])
            group_home_attack_rate = (
                float(tournament_stats[home_id]["goalsFor"]) / group_home_match_count
                if group_home_match_count else group_expected_home_goals
            )
            group_home_defense_rate = (
                float(tournament_stats[home_id]["goalsAgainst"]) / group_home_match_count
                if group_home_match_count else group_expected_away_goals
            )
            group_away_attack_rate = (
                float(tournament_stats[away_id]["goalsFor"]) / group_away_match_count
                if group_away_match_count else group_expected_away_goals
            )
            group_away_defense_rate = (
                float(tournament_stats[away_id]["goalsAgainst"]) / group_away_match_count
                if group_away_match_count else group_expected_home_goals
            )
            group_score_calibration_rows.append(
                {
                    "matchNumber": int(result.get("matchNumber", 0)),
                    "baseExpectedHomeGoals": group_expected_home_goals,
                    "baseExpectedAwayGoals": group_expected_away_goals,
                    "homeTournamentAttackRate": group_home_attack_rate,
                    "homeTournamentDefenseRate": group_home_defense_rate,
                    "awayTournamentAttackRate": group_away_attack_rate,
                    "awayTournamentDefenseRate": group_away_defense_rate,
                    "homeRecentAttackRate": (
                        sum(tournament_stats[home_id]["recentGoalsFor"])
                        / len(tournament_stats[home_id]["recentGoalsFor"])
                        if tournament_stats[home_id]["recentGoalsFor"] else group_home_attack_rate
                    ),
                    "homeRecentDefenseRate": (
                        sum(tournament_stats[home_id]["recentGoalsAgainst"])
                        / len(tournament_stats[home_id]["recentGoalsAgainst"])
                        if tournament_stats[home_id]["recentGoalsAgainst"] else group_home_defense_rate
                    ),
                    "awayRecentAttackRate": (
                        sum(tournament_stats[away_id]["recentGoalsFor"])
                        / len(tournament_stats[away_id]["recentGoalsFor"])
                        if tournament_stats[away_id]["recentGoalsFor"] else group_away_attack_rate
                    ),
                    "awayRecentDefenseRate": (
                        sum(tournament_stats[away_id]["recentGoalsAgainst"])
                        / len(tournament_stats[away_id]["recentGoalsAgainst"])
                        if tournament_stats[away_id]["recentGoalsAgainst"] else group_away_defense_rate
                    ),
                    "tournamentPaceGoalsPerTeam": (
                        tournament_total_goals / (2 * tournament_matches_completed)
                        if tournament_matches_completed else 1.25
                    ),
                    "homePrior": group_home_prior,
                    "awayPrior": group_away_prior,
                    "homeTournamentForm": group_home_form,
                    "awayTournamentForm": group_away_form,
                    "homeEnvironmentReadiness": group_home_environment["score"],
                    "awayEnvironmentReadiness": group_away_environment["score"],
                    "homeTournamentMatchCount": group_home_match_count,
                    "awayTournamentMatchCount": group_away_match_count,
                    "predictedOutcomeLabel": group_predicted_label,
                    "actualHomeScore": home_score,
                    "actualAwayScore": away_score,
                }
            )
        # 只把真正的淘汰赛纳入回测；同一天结束的小组赛不会误算为淘汰赛。
        if is_knockout and result_date >= knockout_start_date:
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
            expected_home_goals = clamp(
                float(home_goal_model.predict([match_features])[0]),
                0.15,
                4.5,
            )
            expected_away_goals = clamp(
                float(away_goal_model.predict([match_features])[0]),
                0.15,
                4.5,
            )
            actual_label = 0 if home_score > away_score else 1 if home_score == away_score else 2
            actual_advancing_team_id = str(
                result.get(
                    "winnerTeamId",
                    home_id if home_score > away_score else away_id if away_score > home_score else "",
                )
            )
            if not actual_advancing_team_id:
                print(
                    f"Knockout draw is missing winnerTeamId: match {result.get('matchNumber')} "
                    f"{home_id} vs {away_id}"
                )
                return 1
            label_names = {0: "home-win", 1: "draw", 2: "away-win"}
            home_environment = pre_match_environment_readiness(
                home_id, match_context, previous_match_by_team, venues_by_id,
            )
            away_environment = pre_match_environment_readiness(
                away_id, match_context, previous_match_by_team, venues_by_id,
            )
            home_prior = pre_tournament_prior_score(teams_by_id[home_id])
            away_prior = pre_tournament_prior_score(teams_by_id[away_id])
            home_form = pre_match_tournament_form(tournament_stats[home_id], home_prior)
            away_form = pre_match_tournament_form(tournament_stats[away_id], away_prior)
            home_match_count = int(tournament_stats[home_id]["matches"])
            away_match_count = int(tournament_stats[away_id]["matches"])
            home_attack_rate = (
                float(tournament_stats[home_id]["goalsFor"]) / home_match_count
                if home_match_count else expected_home_goals
            )
            home_defense_rate = (
                float(tournament_stats[home_id]["goalsAgainst"]) / home_match_count
                if home_match_count else expected_away_goals
            )
            away_attack_rate = (
                float(tournament_stats[away_id]["goalsFor"]) / away_match_count
                if away_match_count else expected_away_goals
            )
            away_defense_rate = (
                float(tournament_stats[away_id]["goalsAgainst"]) / away_match_count
                if away_match_count else expected_home_goals
            )
            home_recent_attack_rate = (
                sum(tournament_stats[home_id]["recentGoalsFor"])
                / len(tournament_stats[home_id]["recentGoalsFor"])
                if tournament_stats[home_id]["recentGoalsFor"] else home_attack_rate
            )
            home_recent_defense_rate = (
                sum(tournament_stats[home_id]["recentGoalsAgainst"])
                / len(tournament_stats[home_id]["recentGoalsAgainst"])
                if tournament_stats[home_id]["recentGoalsAgainst"] else home_defense_rate
            )
            away_recent_attack_rate = (
                sum(tournament_stats[away_id]["recentGoalsFor"])
                / len(tournament_stats[away_id]["recentGoalsFor"])
                if tournament_stats[away_id]["recentGoalsFor"] else away_attack_rate
            )
            away_recent_defense_rate = (
                sum(tournament_stats[away_id]["recentGoalsAgainst"])
                / len(tournament_stats[away_id]["recentGoalsAgainst"])
                if tournament_stats[away_id]["recentGoalsAgainst"] else away_defense_rate
            )
            tournament_pace = (
                tournament_total_goals / (2 * tournament_matches_completed)
                if tournament_matches_completed else 1.25
            )
            home_classifier_advance = round((
                probability_by_label.get(0, 0.0) + probability_by_label.get(1, 0.0) * 0.5
            ) * 100, 12)
            knockout_backtest.append(
                {
                    "matchNumber": int(result.get("matchNumber", 0)),
                    "stage": stage,
                    "date": str(result["date"]),
                    "homeTeamId": home_id,
                    "awayTeamId": away_id,
                    "predictedResult": label_names[predicted_label],
                    "actualResult": label_names[actual_label],
                    "oneXTwoCorrect": predicted_label == actual_label,
                    "confidence": round(float(max(probabilities)), 4),
                    "homeWinProbability": round(probability_by_label.get(0, 0.0), 4),
                    "drawProbability": round(probability_by_label.get(1, 0.0), 4),
                    "awayWinProbability": round(probability_by_label.get(2, 0.0), 4),
                    "actualAdvancingTeamId": actual_advancing_team_id,
                    "homePrior": home_prior,
                    "awayPrior": away_prior,
                    "homeTournamentForm": home_form,
                    "awayTournamentForm": away_form,
                    "homeClassifierAdvance": home_classifier_advance,
                    "awayClassifierAdvance": 100 - home_classifier_advance,
                    "homeEnvironmentReadiness": home_environment["score"],
                    "awayEnvironmentReadiness": away_environment["score"],
                    "homeEnvironment": home_environment,
                    "awayEnvironment": away_environment,
                    "_predictedOutcomeLabel": predicted_label,
                    "baseExpectedHomeGoals": expected_home_goals,
                    "baseExpectedAwayGoals": expected_away_goals,
                    "homeTournamentAttackRate": home_attack_rate,
                    "homeTournamentDefenseRate": home_defense_rate,
                    "awayTournamentAttackRate": away_attack_rate,
                    "awayTournamentDefenseRate": away_defense_rate,
                    "homeRecentAttackRate": home_recent_attack_rate,
                    "homeRecentDefenseRate": home_recent_defense_rate,
                    "awayRecentAttackRate": away_recent_attack_rate,
                    "awayRecentDefenseRate": away_recent_defense_rate,
                    "homeTournamentMatchCount": home_match_count,
                    "awayTournamentMatchCount": away_match_count,
                    "tournamentPaceGoalsPerTeam": tournament_pace,
                    "actualHomeScore": home_score,
                    "actualAwayScore": away_score,
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
            tournament_stats[team_id]["recentGoalsFor"].append(goals_for)
            tournament_stats[team_id]["recentGoalsAgainst"].append(goals_against)
        # 当前世界杯赛果同时享受最高赛事权重和最近一年加成，确保其最能推动最新 Elo。
        append_result(
            home, away, home_score, away_score, current_result_weight, elo,
            recent_points, recent_goal_diff, recent_goals_for, recent_goals_against,
            recent_points_5, recent_points_20, recent_goal_diff_5, recent_goal_diff_20,
            recent_opponent_elo, team_match_counts,
        )
        previous_match_by_team[home_id] = match_context
        previous_match_by_team[away_id] = match_context
        tournament_matches_completed += 1
        tournament_total_goals += home_score + away_score

    # 本届进球校准器只看 72 场小组赛。前 48 场用于拟合候选正则强度，后 24 场按时间
    # 验证；选型后再用全部小组赛重拟合，随后才给淘汰赛记录生成校准预期进球。
    if len(group_score_calibration_rows) != 72:
        print(
            "Current-tournament score calibration requires 72 group-stage matches; "
            f"found {len(group_score_calibration_rows)}."
        )
        return 1
    group_calibration_split = 48
    group_calibration_train = group_score_calibration_rows[:group_calibration_split]
    group_calibration_validation = group_score_calibration_rows[group_calibration_split:]
    group_x_train = [
        tournament_score_calibration_features(row)
        for row in group_calibration_train
    ]
    group_x_validation = [
        tournament_score_calibration_features(row)
        for row in group_calibration_validation
    ]
    group_home_train = [float(row["actualHomeScore"]) for row in group_calibration_train]
    group_away_train = [float(row["actualAwayScore"]) for row in group_calibration_train]
    group_home_validation = [
        float(row["actualHomeScore"]) for row in group_calibration_validation
    ]
    group_away_validation = [
        float(row["actualAwayScore"]) for row in group_calibration_validation
    ]
    group_baseline_home_validation = [
        float(row["baseExpectedHomeGoals"]) for row in group_calibration_validation
    ]
    group_baseline_away_validation = [
        float(row["baseExpectedAwayGoals"]) for row in group_calibration_validation
    ]
    group_baseline_validation_mae = (
        float(mean_absolute_error(group_home_validation, group_baseline_home_validation))
        + float(mean_absolute_error(group_away_validation, group_baseline_away_validation))
    ) / 2
    group_baseline_validation_deviance = (
        float(mean_poisson_deviance(group_home_validation, group_baseline_home_validation))
        + float(mean_poisson_deviance(group_away_validation, group_baseline_away_validation))
    ) / 2
    group_baseline_validation_exact = 0
    for row, home_expected, away_expected in zip(
        group_calibration_validation,
        group_baseline_home_validation,
        group_baseline_away_validation,
    ):
        predicted_home, predicted_away = most_likely_scoreline(
            home_expected,
            away_expected,
            int(row["predictedOutcomeLabel"]),
        )
        group_baseline_validation_exact += int(
            predicted_home == int(row["actualHomeScore"])
            and predicted_away == int(row["actualAwayScore"])
        )
    group_calibration_candidates: list[dict[str, float | int]] = []
    group_calibration_models: dict[float, tuple[object, object]] = {}
    for alpha in [0.05, 0.10, 0.25, 0.50, 1.0, 2.0, 5.0]:
        home_calibrator = make_pipeline(
            StandardScaler(),
            PoissonRegressor(alpha=alpha, max_iter=1000),
        )
        away_calibrator = make_pipeline(
            StandardScaler(),
            PoissonRegressor(alpha=alpha, max_iter=1000),
        )
        home_calibrator.fit(group_x_train, group_home_train)
        away_calibrator.fit(group_x_train, group_away_train)
        home_validation_predictions = [
            clamp(float(value), 0.15, 4.5)
            for value in home_calibrator.predict(group_x_validation)
        ]
        away_validation_predictions = [
            clamp(float(value), 0.15, 4.5)
            for value in away_calibrator.predict(group_x_validation)
        ]
        validation_mae = (
            float(mean_absolute_error(group_home_validation, home_validation_predictions))
            + float(mean_absolute_error(group_away_validation, away_validation_predictions))
        ) / 2
        validation_deviance = (
            float(mean_poisson_deviance(group_home_validation, home_validation_predictions))
            + float(mean_poisson_deviance(group_away_validation, away_validation_predictions))
        ) / 2
        validation_exact = 0
        for row, home_expected, away_expected in zip(
            group_calibration_validation,
            home_validation_predictions,
            away_validation_predictions,
        ):
            predicted_home, predicted_away = most_likely_scoreline(
                home_expected,
                away_expected,
                int(row["predictedOutcomeLabel"]),
            )
            validation_exact += int(
                predicted_home == int(row["actualHomeScore"])
                and predicted_away == int(row["actualAwayScore"])
            )
        group_calibration_candidates.append(
            {
                "alpha": alpha,
                "validationMae": validation_mae,
                "validationPoissonDeviance": validation_deviance,
                "validationExactCorrect": validation_exact,
            }
        )
        group_calibration_models[alpha] = (home_calibrator, away_calibrator)

    selected_group_calibration = min(
        group_calibration_candidates,
        key=lambda item: (
            float(item["validationPoissonDeviance"]),
            float(item["validationMae"]),
            -int(item["validationExactCorrect"]),
        ),
    )
    selected_group_alpha = float(selected_group_calibration["alpha"])
    group_home_calibrator, group_away_calibrator = group_calibration_models[selected_group_alpha]
    all_group_features = [
        tournament_score_calibration_features(row)
        for row in group_score_calibration_rows
    ]
    group_home_calibrator.fit(
        all_group_features,
        [float(row["actualHomeScore"]) for row in group_score_calibration_rows],
    )
    group_away_calibrator.fit(
        all_group_features,
        [float(row["actualAwayScore"]) for row in group_score_calibration_rows],
    )
    for row in knockout_backtest:
        calibration_features = tournament_score_calibration_features(row)
        row["groupCalibratedExpectedHomeGoals"] = clamp(
            float(group_home_calibrator.predict([calibration_features])[0]),
            0.15,
            4.5,
        )
        row["groupCalibratedExpectedAwayGoals"] = clamp(
            float(group_away_calibrator.predict([calibration_features])[0]),
            0.15,
            4.5,
        )
    joblib.dump(
        {
            "homeGroupScoreCalibrator": group_home_calibrator,
            "awayGroupScoreCalibrator": group_away_calibrator,
            "alpha": selected_group_alpha,
        },
        args.model_dir / "world_cup_group_score_calibrator.joblib",
    )

    # 用 32 强和 16 强作为开发回放，只搜索一小组通用全局权重；
    # 四分之一决赛及以后留作时间上更晚的测试，不参与选参。
    development_rows = [
        row for row in knockout_backtest
        if pd.Timestamp(str(row["date"])) < advancement_holdout_start
    ]
    holdout_rows = [
        row for row in knockout_backtest
        if pd.Timestamp(str(row["date"])) >= advancement_holdout_start
    ]
    environment_weight = 0.01
    advancement_weight_candidates: list[dict[str, float | int]] = []
    for prior_weight in [0.40, 0.45, 0.50, 0.55, 0.60]:
        for classifier_weight in [0.05, 0.10, 0.15, 0.20]:
            form_weight = 1 - prior_weight - classifier_weight - environment_weight
            if form_weight <= 0:
                continue
            weights = {
                "prior": prior_weight,
                "form": form_weight,
                "classifier": classifier_weight,
                "environment": environment_weight,
            }
            correct = 0
            for row in development_rows:
                home_advancement_score, away_advancement_score = advancement_scores(row, weights)
                predicted_team_id = (
                    str(row["homeTeamId"])
                    if home_advancement_score >= away_advancement_score
                    else str(row["awayTeamId"])
                )
                correct += int(predicted_team_id == row["actualAdvancingTeamId"])
            advancement_weight_candidates.append({**weights, "developmentCorrect": correct})

    # 同分时选择靠近“赛前与本届状态近似均衡、分类器小幅校准”的中心点，
    # 不根据某一场比赛建立特殊规则。
    selected_advancement_weights = max(
        advancement_weight_candidates,
        key=lambda item: (
            int(item["developmentCorrect"]),
            -abs(float(item["prior"]) - 0.45) - abs(float(item["classifier"]) - 0.10),
        ),
    )
    selected_weights = {
        key: float(selected_advancement_weights[key])
        for key in ["prior", "form", "classifier", "environment"]
    }
    for row in knockout_backtest:
        home_advancement_score, away_advancement_score = advancement_scores(row, selected_weights)
        predicted_team_id = (
            str(row["homeTeamId"])
            if home_advancement_score >= away_advancement_score
            else str(row["awayTeamId"])
        )
        home_advance_probability = clamp(
            1 / (1 + math.exp(-(home_advancement_score - away_advancement_score) / 10)),
            0.05,
            0.95,
        )
        row["homeAdvancementScore"] = round(home_advancement_score, 3)
        row["awayAdvancementScore"] = round(away_advancement_score, 3)
        row["homeAdvanceProbability"] = round(home_advance_probability, 4)
        row["awayAdvanceProbability"] = round(1 - home_advance_probability, 4)
        row["predictedAdvancingTeamId"] = predicted_team_id
        row["advanceCorrect"] = predicted_team_id == row["actualAdvancingTeamId"]
        row["correct"] = row["advanceCorrect"]

    # 比分模型只在 32 强和 16 强开发回放上选择一组通用参数。候选项分别控制：
    # 历史进球模型、本届整体节奏、本届球队攻防、小组赛校准器、总进球缩放和环境准备度修正。
    # 若开发回放成绩相同，优先选择较低的小组赛校准权重，避免为小样本增加不必要复杂度。
    score_parameter_candidates: list[dict[str, float | int]] = []
    for history_weight in [0.30, 0.40, 0.50, 0.60, 0.70]:
        for pace_weight in [0.05, 0.10, 0.15]:
            if history_weight + pace_weight >= 0.90:
                continue
            for attack_share in [0.40, 0.50, 0.60]:
                for recent_match_weight in [0.0, 0.25, 0.50, 0.75]:
                    for scale in [0.90, 1.00, 1.10, 1.20, 1.30]:
                        for environment_adjustment in [0.0, 0.0005, 0.001]:
                            for group_calibration_weight in [0.0, 0.25, 0.50, 0.75, 1.0]:
                                parameters = {
                                    "history": history_weight,
                                    "pace": pace_weight,
                                    "attackShare": attack_share,
                                    "recentMatchWeight": recent_match_weight,
                                    "scale": scale,
                                    "environmentAdjustment": environment_adjustment,
                                    "groupCalibrationWeight": group_calibration_weight,
                                }
                                exact_correct = 0
                                absolute_error = 0.0
                                for row in development_rows:
                                    expected_home, expected_away = calibrated_expected_goals(row, parameters)
                                    predicted_draw = row["predictedResult"] == "draw"
                                    outcome_label = (
                                        1 if predicted_draw
                                        else 0 if row["predictedAdvancingTeamId"] == row["homeTeamId"]
                                        else 2
                                    )
                                    prediction = build_knockout_score_prediction(
                                        expected_home,
                                        expected_away,
                                        outcome_label,
                                        float(row["homeEnvironmentReadiness"]),
                                        float(row["awayEnvironmentReadiness"]),
                                    )
                                    exact_correct += int(
                                        int(prediction["finalTeamAScore"]) == int(row["actualHomeScore"])
                                        and int(prediction["finalTeamBScore"]) == int(row["actualAwayScore"])
                                    )
                                    absolute_error += (
                                        abs(int(prediction["finalTeamAScore"]) - int(row["actualHomeScore"]))
                                        + abs(int(prediction["finalTeamBScore"]) - int(row["actualAwayScore"]))
                                    ) / 2
                                score_parameter_candidates.append(
                                    {
                                        **parameters,
                                        "developmentExactCorrect": exact_correct,
                                        "developmentMae": absolute_error / len(development_rows),
                                    }
                                )

    selected_score_parameters = max(
        score_parameter_candidates,
        key=lambda item: (
            int(item["developmentExactCorrect"]),
            -float(item["developmentMae"]),
            -float(item["groupCalibrationWeight"]),
            -abs(float(item["history"]) - 0.50),
            -abs(float(item["scale"]) - 1.00),
            -abs(float(item["environmentAdjustment"]) - 0.0005),
        ),
    )
    score_parameters = {
        key: float(selected_score_parameters[key])
        for key in [
            "history",
            "pace",
            "attackShare",
            "recentMatchWeight",
            "scale",
            "environmentAdjustment",
            "groupCalibrationWeight",
        ]
    }

    for row in knockout_backtest:
        expected_home, expected_away = calibrated_expected_goals(row, score_parameters)
        predicted_draw = row["predictedResult"] == "draw"
        score_outcome_label = (
            1 if predicted_draw
            else 0 if row["predictedAdvancingTeamId"] == row["homeTeamId"]
            else 2
        )
        score_prediction = build_knockout_score_prediction(
            expected_home,
            expected_away,
            score_outcome_label,
            float(row["homeEnvironmentReadiness"]),
            float(row["awayEnvironmentReadiness"]),
        )
        row.pop("_predictedOutcomeLabel")
        row["scorePrediction"] = score_prediction
        row["scoreAbsoluteError"] = round(
            (
                abs(int(score_prediction["finalTeamAScore"]) - int(row["actualHomeScore"]))
                + abs(int(score_prediction["finalTeamBScore"]) - int(row["actualAwayScore"]))
            )
            / 2,
            3,
        )
        row["exactScoreCorrect"] = (
            int(score_prediction["finalTeamAScore"]) == int(row["actualHomeScore"])
            and int(score_prediction["finalTeamBScore"]) == int(row["actualAwayScore"])
        )

    knockout_one_x_two_correct = sum(1 for row in knockout_backtest if row["oneXTwoCorrect"])
    knockout_one_x_two_accuracy = (
        knockout_one_x_two_correct / len(knockout_backtest) if knockout_backtest else None
    )
    knockout_correct = sum(1 for row in knockout_backtest if row["advanceCorrect"])
    knockout_accuracy = knockout_correct / len(knockout_backtest) if knockout_backtest else None
    development_correct = sum(1 for row in development_rows if row["advanceCorrect"])
    development_accuracy = development_correct / len(development_rows) if development_rows else None
    holdout_correct = sum(1 for row in holdout_rows if row["advanceCorrect"])
    holdout_accuracy = holdout_correct / len(holdout_rows) if holdout_rows else None
    knockout_exact_score_correct = sum(1 for row in knockout_backtest if row["exactScoreCorrect"])
    knockout_exact_score_accuracy = (
        knockout_exact_score_correct / len(knockout_backtest) if knockout_backtest else None
    )
    knockout_score_mae = (
        sum(float(row["scoreAbsoluteError"]) for row in knockout_backtest) / len(knockout_backtest)
        if knockout_backtest else None
    )
    score_development_exact_correct = sum(1 for row in development_rows if row["exactScoreCorrect"])
    score_holdout_exact_correct = sum(1 for row in holdout_rows if row["exactScoreCorrect"])
    score_development_exact_accuracy = (
        score_development_exact_correct / len(development_rows) if development_rows else None
    )
    score_holdout_exact_accuracy = (
        score_holdout_exact_correct / len(holdout_rows) if holdout_rows else None
    )
    individual_team_predictions_within_one = sum(
        int(abs(int(row["scorePrediction"]["finalTeamAScore"]) - int(row["actualHomeScore"])) <= 1)
        + int(abs(int(row["scorePrediction"]["finalTeamBScore"]) - int(row["actualAwayScore"])) <= 1)
        for row in knockout_backtest
    )
    both_teams_within_one = sum(
        int(
            abs(int(row["scorePrediction"]["finalTeamAScore"]) - int(row["actualHomeScore"])) <= 1
            and abs(int(row["scorePrediction"]["finalTeamBScore"]) - int(row["actualAwayScore"])) <= 1
        )
        for row in knockout_backtest
    )
    individual_team_within_one_accuracy = (
        individual_team_predictions_within_one / (len(knockout_backtest) * 2)
        if knockout_backtest else None
    )
    both_teams_within_one_accuracy = (
        both_teams_within_one / len(knockout_backtest) if knockout_backtest else None
    )

    # 为尚未开赛、双方已经确定的比赛生成赛前预测。
    # 球队战术、伤停和角色适配继续通过球队画像进入网页端综合模型；
    # 这里额外提供经过回测的赛前实力/状态/环境路线。
    scheduled_match_predictions: list[dict[str, object]] = []
    for scheduled_match in current_results_snapshot.get("scheduledMatches", []):
        home_id = str(scheduled_match["homeTeamId"])
        away_id = str(scheduled_match["awayTeamId"])
        if home_id not in teams_by_id or away_id not in teams_by_id:
            continue
        home = str(teams_by_id[home_id]["normalized"])
        away = str(teams_by_id[away_id]["normalized"])
        scheduled_date = pd.Timestamp(scheduled_match["date"])
        scheduled_context = {**scheduled_match, "parsedDate": scheduled_date}
        competition_weight = tournament_weight("FIFA World Cup")
        sample_weight = competition_weight * recency_weight(scheduled_date, reference_date)
        scheduled_features = build_match_features(
            home, away, scheduled_date, "FIFA World Cup", 1,
            competition_weight, sample_weight,
            elo, recent_points, recent_goal_diff, recent_goals_for, recent_goals_against,
            recent_points_5, recent_points_20, recent_goal_diff_5, recent_goal_diff_20,
            recent_opponent_elo, team_match_counts,
        )
        probabilities = selected_model.predict_proba([scheduled_features])[0]
        probability_by_label = {
            int(label): float(probability)
            for label, probability in zip(selected_model.classes_, probabilities)
        }
        scheduled_predicted_label = int(selected_model.classes_[max(
            range(len(probabilities)),
            key=lambda index: probabilities[index],
        )])
        if probability_by_label.get(1, 0.0) >= draw_threshold:
            scheduled_predicted_label = 1
        expected_home_goals = clamp(
            float(home_goal_model.predict([scheduled_features])[0]),
            0.15,
            4.5,
        )
        expected_away_goals = clamp(
            float(away_goal_model.predict([scheduled_features])[0]),
            0.15,
            4.5,
        )
        home_classifier_advance = round((
            probability_by_label.get(0, 0.0) + probability_by_label.get(1, 0.0) * 0.5
        ) * 100, 12)
        home_prior = pre_tournament_prior_score(teams_by_id[home_id])
        away_prior = pre_tournament_prior_score(teams_by_id[away_id])
        home_form = pre_match_tournament_form(tournament_stats[home_id], home_prior)
        away_form = pre_match_tournament_form(tournament_stats[away_id], away_prior)
        home_environment = pre_match_environment_readiness(
            home_id, scheduled_context, previous_match_by_team, venues_by_id,
        )
        away_environment = pre_match_environment_readiness(
            away_id, scheduled_context, previous_match_by_team, venues_by_id,
        )
        home_match_count = int(tournament_stats[home_id]["matches"])
        away_match_count = int(tournament_stats[away_id]["matches"])
        scheduled_score_context = {
            "baseExpectedHomeGoals": expected_home_goals,
            "baseExpectedAwayGoals": expected_away_goals,
            "homeTournamentAttackRate": (
                float(tournament_stats[home_id]["goalsFor"]) / home_match_count
                if home_match_count else expected_home_goals
            ),
            "homeTournamentDefenseRate": (
                float(tournament_stats[home_id]["goalsAgainst"]) / home_match_count
                if home_match_count else expected_away_goals
            ),
            "awayTournamentAttackRate": (
                float(tournament_stats[away_id]["goalsFor"]) / away_match_count
                if away_match_count else expected_away_goals
            ),
            "awayTournamentDefenseRate": (
                float(tournament_stats[away_id]["goalsAgainst"]) / away_match_count
                if away_match_count else expected_home_goals
            ),
            "homeRecentAttackRate": (
                sum(tournament_stats[home_id]["recentGoalsFor"])
                / len(tournament_stats[home_id]["recentGoalsFor"])
                if tournament_stats[home_id]["recentGoalsFor"]
                else expected_home_goals
            ),
            "homeRecentDefenseRate": (
                sum(tournament_stats[home_id]["recentGoalsAgainst"])
                / len(tournament_stats[home_id]["recentGoalsAgainst"])
                if tournament_stats[home_id]["recentGoalsAgainst"]
                else expected_away_goals
            ),
            "awayRecentAttackRate": (
                sum(tournament_stats[away_id]["recentGoalsFor"])
                / len(tournament_stats[away_id]["recentGoalsFor"])
                if tournament_stats[away_id]["recentGoalsFor"]
                else expected_away_goals
            ),
            "awayRecentDefenseRate": (
                sum(tournament_stats[away_id]["recentGoalsAgainst"])
                / len(tournament_stats[away_id]["recentGoalsAgainst"])
                if tournament_stats[away_id]["recentGoalsAgainst"]
                else expected_home_goals
            ),
            "tournamentPaceGoalsPerTeam": (
                tournament_total_goals / (2 * tournament_matches_completed)
                if tournament_matches_completed else 1.25
            ),
            "homePrior": home_prior,
            "awayPrior": away_prior,
            "homeTournamentForm": home_form,
            "awayTournamentForm": away_form,
            "homeEnvironmentReadiness": home_environment["score"],
            "awayEnvironmentReadiness": away_environment["score"],
            "homeTournamentMatchCount": home_match_count,
            "awayTournamentMatchCount": away_match_count,
        }
        scheduled_calibration_features = tournament_score_calibration_features(
            scheduled_score_context,
        )
        scheduled_score_context["groupCalibratedExpectedHomeGoals"] = clamp(
            float(group_home_calibrator.predict([scheduled_calibration_features])[0]),
            0.15,
            4.5,
        )
        scheduled_score_context["groupCalibratedExpectedAwayGoals"] = clamp(
            float(group_away_calibrator.predict([scheduled_calibration_features])[0]),
            0.15,
            4.5,
        )
        expected_home_goals, expected_away_goals = calibrated_expected_goals(
            scheduled_score_context,
            score_parameters,
        )
        scoring_record = {
            "homePrior": home_prior,
            "awayPrior": away_prior,
            "homeTournamentForm": home_form,
            "awayTournamentForm": away_form,
            "homeClassifierAdvance": home_classifier_advance,
            "awayClassifierAdvance": 100 - home_classifier_advance,
            "homeEnvironmentReadiness": home_environment["score"],
            "awayEnvironmentReadiness": away_environment["score"],
        }
        home_advancement_score, away_advancement_score = advancement_scores(
            scoring_record, selected_weights,
        )
        home_advance_probability = clamp(
            1 / (1 + math.exp(-(home_advancement_score - away_advancement_score) / 10)),
            0.05,
            0.95,
        )
        advance_gap = abs(home_advance_probability - (1 - home_advance_probability))
        if scheduled_predicted_label != 1:
            scheduled_predicted_label = 0 if home_advance_probability >= 0.5 else 2
        score_prediction = build_knockout_score_prediction(
            expected_home_goals,
            expected_away_goals,
            scheduled_predicted_label,
            float(home_environment["score"]),
            float(away_environment["score"]),
        )
        component_edges = [
            ("preTournamentPrior", abs(home_prior - away_prior) * selected_weights["prior"]),
            ("currentTournamentForm", abs(home_form - away_form) * selected_weights["form"]),
            (
                "historicalClassifier",
                abs(home_classifier_advance - (100 - home_classifier_advance))
                * selected_weights["classifier"],
            ),
            (
                "environmentReadiness",
                abs(home_environment["score"] - away_environment["score"])
                * selected_weights["environment"],
            ),
        ]
        top_factors = [
            key for key, _ in sorted(component_edges, key=lambda item: item[1], reverse=True)[:3]
        ]
        scheduled_match_predictions.append(
            {
                "matchNumber": int(scheduled_match["matchNumber"]),
                "teamAId": home_id,
                "teamBId": away_id,
                "teamAWinProbability": round(probability_by_label.get(0, 0.0), 4),
                "drawProbability": round(probability_by_label.get(1, 0.0), 4),
                "teamBWinProbability": round(probability_by_label.get(2, 0.0), 4),
                "teamAAdvanceProbability": round(home_advance_probability, 4),
                "teamBAdvanceProbability": round(1 - home_advance_probability, 4),
                "topFactors": top_factors,
                "confidenceScore": round(clamp(52 + advance_gap * 55, 38, 96)),
                "upsetRisk": "low" if advance_gap >= 0.28 else "medium" if advance_gap >= 0.14 else "high",
                "scorePrediction": score_prediction,
                "venueId": str(scheduled_match.get("venueId", "")),
                "temperatureC": round(float(home_environment["temperatureC"]), 1),
                "humidityPct": round(float(home_environment["humidityPct"]), 1),
                "altitudeM": round(float(home_environment["altitudeM"])),
                "teamAEnvironmentReadiness": round(float(home_environment["score"]), 1),
                "teamBEnvironmentReadiness": round(float(away_environment["score"]), 1),
                "teamARestDays": round(float(home_environment["restDays"])),
                "teamBRestDays": round(float(away_environment["restDays"])),
                "teamATravelDistanceKm": round(float(home_environment["travelDistanceKm"])),
                "teamBTravelDistanceKm": round(float(away_environment["travelDistanceKm"])),
            }
        )

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
                "updatedAt": current_results_snapshot["updatedAt"],
                "explanation": (
                    f"Hybrid estimate using recency-weighted international history, {match_count} current World Cup "
                    "match(es), current squad structure, availability, player-role fit, tactical fit, cohesion, and coach adaptability."
                ),
            }
        )

    profiles.sort(key=lambda item: (-item["mlStrengthScore"], -item["confidenceScore"], item["teamId"]))
    candidate_score_text = ", ".join(f"{name}: {score:.3f}" for name, _, score in candidate_scores)
    knockout_summary = (
        f"{knockout_correct}/{len(knockout_backtest)} advancing teams correct ({knockout_accuracy:.3f})"
        if knockout_accuracy is not None
        else "not available"
    )
    one_x_two_summary = (
        f"{knockout_one_x_two_correct}/{len(knockout_backtest)} correct ({knockout_one_x_two_accuracy:.3f})"
        if knockout_one_x_two_accuracy is not None
        else "not available"
    )
    meta = {
        "modelName": f"Current-State Hybrid ({model_name})",
        "trainedAt": current_results_snapshot["updatedAt"],
        "trainingDataCutoff": current_results_snapshot.get(
            "competitionDateCutoff", str(results["date"].max().date())
        ),
        "historicalTrainingDataCutoff": str(results["date"].max().date()),
        "currentTournamentStartDate": str(current_tournament_start.date()),
        "historicalSourceRowsOnOrAfterStart": source_rows_on_or_after_start,
        "scoredHistoricalRowsOnOrAfterStart": scored_rows_on_or_after_start,
        "dataSources": [
            "Historical international results CSV (local)",
            "Historical CSV strictly truncated before the 2026 World Cup opening match",
            "Current tournament state snapshot (committed)",
            "Frozen pre-tournament team signals (committed)",
            "Recency-weighted international match history",
            "Goal-model half-life selected from five pre-tournament time-decay candidates",
            "Current World Cup results through the stated cutoff",
            "Chronological 48-match fit / 24-match validation split inside the completed group stage",
            "Schedule-known venue, altitude, roof, July climate baseline, rest, and travel context",
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
        "knockoutValidationMethod": (
            "Sequential pre-match advancement replay. Round of 32 and Round of 16 select one global "
            "weight set; quarter-finals are a later diagnostic slice excluded from automated parameter "
            "search. Every result is appended only after its prediction."
        ),
        "knockoutOneXTwoAccuracy": (
            round(knockout_one_x_two_accuracy, 4)
            if knockout_one_x_two_accuracy is not None else None
        ),
        "knockoutOneXTwoCorrect": knockout_one_x_two_correct,
        "knockoutDevelopmentAccuracy": (
            round(development_accuracy, 4) if development_accuracy is not None else None
        ),
        "knockoutDevelopmentMatches": len(development_rows),
        "knockoutDevelopmentCorrect": development_correct,
        "knockoutHoldoutAccuracy": (
            round(holdout_accuracy, 4) if holdout_accuracy is not None else None
        ),
        "knockoutHoldoutMatches": len(holdout_rows),
        "knockoutHoldoutCorrect": holdout_correct,
        "knockoutHoldoutStartDate": str(advancement_holdout_start.date()),
        "advancementPriorWeight": round(selected_weights["prior"], 4),
        "advancementFormWeight": round(selected_weights["form"], 4),
        "advancementClassifierWeight": round(selected_weights["classifier"], 4),
        "advancementEnvironmentWeight": round(selected_weights["environment"], 4),
        "scoreModelName": "Recency-selected Dual Poisson HGB + tournament calibration",
        "scoreRecencyHalfLifeYears": selected_score_half_life,
        "scoreRecencyCandidatesTested": len(score_recency_candidates),
        "historicalScoreValidationMae": round(historical_score_validation_mae, 4),
        "historicalScoreValidationPoissonDeviance": round(
            historical_score_validation_deviance, 4,
        ),
        "historicalExactScoreAccuracy": round(historical_exact_score_accuracy, 4),
        "knockoutScoreMatches": len(knockout_backtest),
        "knockoutScoreMae": round(float(knockout_score_mae), 4),
        "knockoutExactScoreCorrect": knockout_exact_score_correct,
        "knockoutExactScoreAccuracy": round(float(knockout_exact_score_accuracy), 4),
        "scoreDevelopmentExactCorrect": score_development_exact_correct,
        "scoreDevelopmentExactAccuracy": round(float(score_development_exact_accuracy), 4),
        "scoreHoldoutExactCorrect": score_holdout_exact_correct,
        "scoreHoldoutExactAccuracy": round(float(score_holdout_exact_accuracy), 4),
        "knockoutIndividualTeamWithinOneCorrect": individual_team_predictions_within_one,
        "knockoutIndividualTeamWithinOneAccuracy": round(float(individual_team_within_one_accuracy), 4),
        "knockoutBothTeamsWithinOneCorrect": both_teams_within_one,
        "knockoutBothTeamsWithinOneAccuracy": round(float(both_teams_within_one_accuracy), 4),
        "scoreHistoryWeight": round(score_parameters["history"], 4),
        "scorePaceWeight": round(score_parameters["pace"], 4),
        "scoreAttackShare": round(score_parameters["attackShare"], 4),
        "scoreRecentMatchWeight": round(score_parameters["recentMatchWeight"], 4),
        "scoreScale": round(score_parameters["scale"], 4),
        "scoreEnvironmentAdjustment": round(score_parameters["environmentAdjustment"], 6),
        "scoreGroupCalibrationWeight": round(score_parameters["groupCalibrationWeight"], 4),
        "groupScoreCalibrationModelName": "Standardized Poisson regression",
        "groupScoreCalibrationRows": len(group_score_calibration_rows),
        "groupScoreCalibrationValidationRows": len(group_calibration_validation),
        "groupScoreCalibrationAlpha": round(selected_group_alpha, 4),
        "groupScoreCalibrationValidationMae": round(
            float(selected_group_calibration["validationMae"]), 4,
        ),
        "groupScoreCalibrationValidationPoissonDeviance": round(
            float(selected_group_calibration["validationPoissonDeviance"]), 4,
        ),
        "groupScoreCalibrationValidationExactCorrect": int(
            selected_group_calibration["validationExactCorrect"],
        ),
        "groupScoreCalibrationValidationExactAccuracy": round(
            int(selected_group_calibration["validationExactCorrect"])
            / len(group_calibration_validation),
            4,
        ),
        "groupScoreBaselineValidationMae": round(group_baseline_validation_mae, 4),
        "groupScoreBaselineValidationPoissonDeviance": round(
            group_baseline_validation_deviance, 4,
        ),
        "groupScoreBaselineValidationExactCorrect": group_baseline_validation_exact,
        "groupScoreBaselineValidationExactAccuracy": round(
            group_baseline_validation_exact / len(group_calibration_validation),
            4,
        ),
        "notes": (
            f"Classifier selected by time-ordered validation, then refit on {len(results)} pre-tournament historical "
            "matches with exponential time decay and final-tournament "
            f"matches weighted highest. The match model now uses {len(features[0])} features, including multiple "
            f"recent-form windows, Elo level and expected score, opponent strength, team experience, match type, "
            f"and recency weight. Candidate validation scores: {candidate_score_text}. Profiles blend current "
            f"tournament evidence, availability, tactical fit, cohesion, and coach adaptability. Baseline accuracy: "
            f"{baseline_accuracy:.3f}; raw selected accuracy: {raw_validation_accuracy:.3f}; draw-calibrated "
            f"accuracy: {validation_accuracy:.3f} at threshold {draw_threshold:.2f}. Sequential knockout "
            f"advancement replay: {knockout_summary}; 1X2 replay: {one_x_two_summary}. Advancement weights are "
            f"prior {selected_weights['prior']:.2f}, current form {selected_weights['form']:.2f}, historical "
            f"classifier {selected_weights['classifier']:.2f}, and pre-match environment "
            f"{selected_weights['environment']:.2f}. The later holdout contains only {len(holdout_rows)} matches, "
            f"so its accuracy must be read with a small-sample caveat. The Poisson score models have historical "
            f"half-life {selected_score_half_life:.1f} years, per-team MAE "
            f"{historical_score_validation_mae:.3f}, and knockout exact-score accuracy "
            f"{knockout_exact_score_accuracy:.3f}. Score calibration blends historical expected goals "
            f"({score_parameters['history']:.0%}), current-tournament attack/defence "
            f"({1 - score_parameters['history'] - score_parameters['pace']:.0%}), and tournament pace "
            f"({score_parameters['pace']:.0%}); the current signal gives "
            f"{score_parameters['recentMatchWeight']:.0%} to the latest three matches. A Poisson calibrator "
            f"selected on a chronological 48/24 group-stage split contributes "
            f"{score_parameters['groupCalibrationWeight']:.0%}. Its standalone group validation MAE is "
            f"{float(selected_group_calibration['validationMae']):.3f}, versus "
            f"{group_baseline_validation_mae:.3f} for the refreshed historical baseline, so it is treated "
            "as a tournament-context blend rather than an independent score predictor. Penalty-shootout goals "
            "are never included. "
            "Context scores are analyst estimates and "
            "should be refreshed as news changes."
        ),
    }

    # modelPredictions.ts 是自动生成文件，不应手改；改完权重后重新运行本脚本即可覆盖。
    output = f'''import type {{ ModelMatchupPrediction, ModelPredictionProfile, PredictionModelMeta }} from "../types/worldCup";

export const predictionModelMeta: PredictionModelMeta = {json_for_ts(meta)};

export const modelPredictionProfiles: ModelPredictionProfile[] = {json_for_ts(profiles)};

export const modelScheduledMatchPredictions: ModelMatchupPrediction[] = {json_for_ts(scheduled_match_predictions)};
'''
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(output, encoding="utf-8")
    args.profile_json.parent.mkdir(parents=True, exist_ok=True)
    args.profile_json.write_text(
        json.dumps(
            {
                "meta": meta,
                "profiles": profiles,
                "scheduledMatchPredictions": scheduled_match_predictions,
                "advancementWeightCandidates": advancement_weight_candidates,
                "scoreRecencyCandidates": score_recency_candidates,
                "groupCalibrationCandidates": group_calibration_candidates,
                "scoreParameterCandidates": score_parameter_candidates,
                "knockoutBacktest": knockout_backtest,
            },
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
    print(
        "Historical score recency: "
        f"{selected_score_half_life:.1f}-year half-life, validation Poisson deviance "
        f"{historical_score_validation_deviance:.3f}, MAE {historical_score_validation_mae:.3f}"
    )
    print(f"Current tournament results incorporated: {len(current_results)}")
    print(
        "Group-stage goal calibrator: "
        f"alpha={selected_group_alpha:.2f}, validation MAE "
        f"{float(selected_group_calibration['validationMae']):.3f}, exact "
        f"{int(selected_group_calibration['validationExactCorrect'])}/"
        f"{len(group_calibration_validation)}; historical baseline MAE "
        f"{group_baseline_validation_mae:.3f}, exact {group_baseline_validation_exact}/"
        f"{len(group_calibration_validation)}"
    )
    if knockout_accuracy is not None:
        print(
            f"Sequential knockout advancement replay: {knockout_correct}/{len(knockout_backtest)} "
            f"({knockout_accuracy:.3f})"
        )
        print(
            f"  Development: {development_correct}/{len(development_rows)} "
            f"({development_accuracy:.3f}); later holdout: {holdout_correct}/{len(holdout_rows)} "
            f"({holdout_accuracy:.3f})"
        )
        print(
            f"  1X2 replay: {knockout_one_x_two_correct}/{len(knockout_backtest)} "
            f"({knockout_one_x_two_accuracy:.3f})"
        )
        print(
            f"  Exact score: {knockout_exact_score_correct}/{len(knockout_backtest)} "
            f"({knockout_exact_score_accuracy:.3f}); per-team MAE {knockout_score_mae:.3f}"
        )
        print(
            f"  Exact score development: {score_development_exact_correct}/{len(development_rows)}; "
            f"later holdout: {score_holdout_exact_correct}/{len(holdout_rows)}"
        )
        print(
            f"  Within one goal: {individual_team_predictions_within_one}/{len(knockout_backtest) * 2} "
            f"individual team scores; {both_teams_within_one}/{len(knockout_backtest)} complete scorelines"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
