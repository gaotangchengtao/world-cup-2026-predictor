"""检查实时赛果和淘汰赛回测输出是否自洽。

先运行 scripts/train_model.py，再运行本脚本。任何检查失败都会返回非零状态，
适合在提交 GitHub 前使用，也方便初学者快速判断模型文件是否可用。
"""

from __future__ import annotations

import json
import math
import re
import sys
from collections import Counter
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RESULTS_PATH = ROOT / "data" / "current" / "world_cup_2026_results.json"
STATE_PATH = ROOT / "data" / "current" / "world_cup_2026_state.json"
VENUES_PATH = ROOT / "data" / "current" / "world_cup_2026_venues.json"
PROFILE_PATH = ROOT / "outputs" / "current_model_profiles.json"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def multiclass_log_loss(labels: list[int], probability_rows: list[list[float]]) -> float:
    return sum(
        -math.log(max(1e-12, min(1.0, probabilities[label])))
        for label, probabilities in zip(labels, probability_rows)
    ) / len(labels)


def multiclass_brier_score(labels: list[int], probability_rows: list[list[float]]) -> float:
    return sum(
        sum(
            (probability - (1.0 if index == label else 0.0)) ** 2
            for index, probability in enumerate(probabilities)
        )
        for label, probabilities in zip(labels, probability_rows)
    ) / len(labels)


def ranked_probability_score(labels: list[int], probability_rows: list[list[float]]) -> float:
    total = 0.0
    for label, probabilities in zip(labels, probability_rows):
        observed = [1.0 if index == label else 0.0 for index in range(3)]
        total += (
            (probabilities[0] - observed[0]) ** 2
            + (probabilities[0] + probabilities[1] - observed[0] - observed[1]) ** 2
        ) / 2
    return total / len(labels)


def main() -> int:
    require(RESULTS_PATH.exists(), f"缺少赛果文件：{RESULTS_PATH}")
    require(STATE_PATH.exists(), f"缺少赛事状态文件：{STATE_PATH}")
    require(VENUES_PATH.exists(), f"缺少场馆环境文件：{VENUES_PATH}")
    require(PROFILE_PATH.exists(), "缺少模型输出，请先运行 scripts/train_model.py")
    for text_path in [RESULTS_PATH, STATE_PATH, VENUES_PATH, PROFILE_PATH]:
        text = text_path.read_text(encoding="utf-8")
        require("\ufffd" not in text, f"{text_path.name} 含有编码替换字符")
        require(
            re.search(r"\?{4,}", text) is None,
            f"{text_path.name} 疑似含有连续问号乱码",
        )
    results = json.loads(RESULTS_PATH.read_text(encoding="utf-8"))
    output = json.loads(PROFILE_PATH.read_text(encoding="utf-8"))
    matches = results["matches"]
    backtest = output["knockoutBacktest"]
    meta = output["meta"]

    require(len(matches) == results["matchCount"] == 100, "当前应有 100 场已结束比赛")
    require(len({row["matchNumber"] for row in matches}) == len(matches), "比赛编号存在重复")
    stage_counts = Counter(row["stage"] for row in matches)
    require(stage_counts["group-stage"] == 72, "小组赛应为 72 场")
    require(stage_counts["round-of-32"] == 16, "32 强应为 16 场")
    require(stage_counts["round-of-16"] == 8, "16 强应为 8 场")
    require(stage_counts["quarter-finals"] == 4, "四分之一决赛应为 4 场")

    for row in matches:
        if row["stage"] == "group-stage":
            continue
        require(
            row.get("winnerTeamId") in {row["homeTeamId"], row["awayTeamId"]},
            f"淘汰赛 M{row['matchNumber']} 缺少合法晋级者",
        )

    require(len(backtest) == 28, "淘汰赛回测应为 28 场")
    advance_correct = sum(bool(row["advanceCorrect"]) for row in backtest)
    one_x_two_correct = sum(bool(row["oneXTwoCorrect"]) for row in backtest)
    require(advance_correct == meta["knockoutValidationCorrect"], "晋级者命中数不一致")
    require(one_x_two_correct == meta["knockoutOneXTwoCorrect"], "胜平负命中数不一致")
    require(
        math.isclose(meta["knockoutValidationAccuracy"], advance_correct / len(backtest), abs_tol=1e-4),
        "晋级者准确率计算不一致",
    )
    require(
        math.isclose(meta["knockoutOneXTwoAccuracy"], one_x_two_correct / len(backtest), abs_tol=1e-4),
        "胜平负准确率计算不一致",
    )
    probability_labels = [
        {"home-win": 0, "draw": 1, "away-win": 2}[row["actualResult"]]
        for row in backtest
    ]
    probability_rows = [
        [row["homeWinProbability"], row["drawProbability"], row["awayWinProbability"]]
        for row in backtest
    ]
    require(
        math.isclose(
            meta["knockoutProbabilityLogLoss"],
            multiclass_log_loss(probability_labels, probability_rows),
            abs_tol=1e-4,
        ),
        "淘汰赛概率对数损失计算不一致",
    )
    require(
        math.isclose(
            meta["knockoutProbabilityBrierScore"],
            multiclass_brier_score(probability_labels, probability_rows),
            abs_tol=1e-4,
        ),
        "淘汰赛概率 Brier 分数计算不一致",
    )
    require(
        math.isclose(
            meta["knockoutProbabilityRankedProbabilityScore"],
            ranked_probability_score(probability_labels, probability_rows),
            abs_tol=1e-4,
        ),
        "淘汰赛概率 RPS 计算不一致",
    )
    require(meta["knockoutValidationAccuracy"] > 0.85, "晋级者顺序回放尚未超过 85% 目标")
    weight_sum = sum(
        meta[key]
        for key in [
            "advancementPriorWeight",
            "advancementFormWeight",
            "advancementClassifierWeight",
            "advancementEnvironmentWeight",
        ]
    )
    require(math.isclose(weight_sum, 1.0, abs_tol=1e-9), "晋级模型权重之和必须为 100%")
    require(meta["knockoutDevelopmentMatches"] == 24, "开发回放场数应为 24")
    require(meta["knockoutHoldoutMatches"] == 4, "留出测试场数应为 4")
    require(
        meta["knockoutDevelopmentCorrect"]
        == sum(bool(row["advanceCorrect"]) for row in backtest[:24]),
        "开发回放命中数不一致",
    )
    require(
        meta["knockoutHoldoutCorrect"]
        == sum(bool(row["advanceCorrect"]) for row in backtest[24:]),
        "留出测试命中数不一致",
    )
    historical_cutoff = date.fromisoformat(meta["historicalTrainingDataCutoff"])
    tournament_start = date.fromisoformat(meta["currentTournamentStartDate"])
    require(historical_cutoff < tournament_start, "历史训练数据必须在本届世界杯开赛前截断")
    require(meta["historicalSourceRowsOnOrAfterStart"] >= 0, "历史 CSV 边界计数无效")
    require(meta["scoredHistoricalRowsOnOrAfterStart"] >= 0, "历史 CSV 赛果边界计数无效")
    require(
        meta["historicalTrainingRows"]
        + meta["historicalTuningRows"]
        + meta["historicalEvaluationRows"]
        == meta["historicalRows"],
        "历史训练、调参和最终评估样本之和不一致",
    )
    require(
        date.fromisoformat(meta["historicalTrainingEndDate"])
        <= date.fromisoformat(meta["historicalTuningStartDate"])
        <= date.fromisoformat(meta["historicalTuningEndDate"])
        <= date.fromisoformat(meta["historicalEvaluationStartDate"])
        <= date.fromisoformat(meta["historicalEvaluationEndDate"]),
        "历史三段时间边界没有严格按先后排列",
    )
    require(meta["validationLogLoss"] > 0, "最终留出集对数损失无效")
    require(0 <= meta["validationBrierScore"] <= 2, "最终留出集 Brier 分数无效")
    require(0 <= meta["validationRankedProbabilityScore"] <= 1, "最终留出集 RPS 无效")
    require(meta["probabilityTemperature"] > 0, "概率温度必须大于 0")
    require(meta["drawCalibrationMinimumGain"] >= 0, "平局阈值最小收益门槛无效")

    outcome_feature_candidates = output["outcomeFeatureCandidates"]
    require(
        meta["outcomeFeatureCandidatesTested"] == len(outcome_feature_candidates),
        "胜平负变量集候选数量不一致",
    )
    best_outcome_accuracy = max(
        float(item["accuracy"]) for item in outcome_feature_candidates
    )
    stable_outcome_candidates = [
        item for item in outcome_feature_candidates
        if float(item["accuracy"])
        >= best_outcome_accuracy - float(meta["outcomeFeatureSelectionTolerance"])
    ]
    selected_outcome_candidate = min(
        stable_outcome_candidates,
        key=lambda item: (
            float(item["rankedProbabilityScore"]),
            float(item["logLoss"]),
            int(item["featureCount"]),
            -float(item["accuracy"]),
        ),
    )
    require(
        meta["outcomeFeatureSet"] == selected_outcome_candidate["featureSet"],
        "胜平负变量集与时间验证选择不一致",
    )
    require(
        meta["outcomeFeatureCount"] == int(selected_outcome_candidate["featureCount"]),
        "胜平负变量数量不一致",
    )
    outcome_recency_candidates = output["outcomeRecencyCandidates"]
    require(
        meta["outcomeRecencyCandidatesTested"] == len(outcome_recency_candidates),
        "胜平负时间尺度候选数量不一致",
    )
    best_outcome_recency_accuracy = max(
        float(item["validationAccuracy"]) for item in outcome_recency_candidates
    )
    stable_outcome_recency = [
        item for item in outcome_recency_candidates
        if float(item["validationAccuracy"])
        >= best_outcome_recency_accuracy
        - float(meta["outcomeRecencySelectionTolerance"])
    ]
    selected_outcome_recency = min(
        stable_outcome_recency,
        key=lambda item: (
            float(item["validationRankedProbabilityScore"]),
            float(item["validationLogLoss"]),
            abs(float(item["halfLifeYears"]) - 1.5),
        ),
    )
    require(
        math.isclose(
            meta["outcomeRecencyHalfLifeYears"],
            float(selected_outcome_recency["halfLifeYears"]),
            abs_tol=1e-9,
        ),
        "胜平负时间半衰期与稳健验证选择不一致",
    )
    temperature_candidates = output["probabilityTemperatureCandidates"]
    require(
        meta["probabilityTemperatureCandidatesTested"] == len(temperature_candidates),
        "概率温度候选数量不一致",
    )
    selected_temperature = min(
        temperature_candidates,
        key=lambda item: (
            float(item["logLoss"]),
            float(item["rankedProbabilityScore"]),
            abs(float(item["temperature"]) - 1.0),
        ),
    )
    require(
        math.isclose(
            meta["probabilityTemperature"],
            float(selected_temperature["temperature"]),
            abs_tol=1e-9,
        ),
        "概率温度与历史调参结果不一致",
    )

    score_errors = []
    exact_score_correct = 0
    individual_team_within_one = 0
    both_teams_within_one = 0
    for row in backtest:
        score = row["scorePrediction"]
        require(
            score["finalTeamAScore"]
            == score["regulationTeamAScore"] + score["extraTimeTeamAScore"],
            f"M{row['matchNumber']} 主队最终比分与常规时间/加时不一致",
        )
        require(
            score["finalTeamBScore"]
            == score["regulationTeamBScore"] + score["extraTimeTeamBScore"],
            f"M{row['matchNumber']} 客队最终比分与常规时间/加时不一致",
        )
        if score["decidedBy"] == "penalties":
            require(
                score["finalTeamAScore"] == score["finalTeamBScore"],
                f"M{row['matchNumber']} 标记点球决胜时，120 分钟比分必须相同",
            )
        if not score["extraTimePlayed"]:
            require(
                score["extraTimeTeamAScore"] == score["extraTimeTeamBScore"] == 0,
                f"M{row['matchNumber']} 未进入加时却记录了加时进球",
            )
        require(
            score["distributionFamily"] == meta["scoreDistributionFamily"],
            f"M{row['matchNumber']} 比分分布与模型元数据不一致",
        )
        error = (
            abs(score["finalTeamAScore"] - row["actualHomeScore"])
            + abs(score["finalTeamBScore"] - row["actualAwayScore"])
        ) / 2
        score_errors.append(error)
        exact_score_correct += int(
            score["finalTeamAScore"] == row["actualHomeScore"]
            and score["finalTeamBScore"] == row["actualAwayScore"]
        )
        home_within_one = abs(score["finalTeamAScore"] - row["actualHomeScore"]) <= 1
        away_within_one = abs(score["finalTeamBScore"] - row["actualAwayScore"]) <= 1
        individual_team_within_one += int(home_within_one) + int(away_within_one)
        both_teams_within_one += int(home_within_one and away_within_one)
    require(meta["knockoutScoreMatches"] == len(backtest), "比分回测场数不一致")
    require(meta["knockoutExactScoreCorrect"] == exact_score_correct, "精确比分命中数不一致")
    require(
        math.isclose(meta["knockoutScoreMae"], sum(score_errors) / len(score_errors), abs_tol=1e-4),
        "比分平均绝对误差不一致",
    )
    require(
        math.isclose(
            meta["knockoutExactScoreAccuracy"],
            exact_score_correct / len(backtest),
            abs_tol=1e-4,
        ),
        "精确比分准确率不一致",
    )
    require(
        meta["scoreDevelopmentExactCorrect"]
        == sum(bool(row["exactScoreCorrect"]) for row in backtest[:24]),
        "比分开发回放命中数不一致",
    )
    require(
        meta["scoreHoldoutExactCorrect"]
        == sum(bool(row["exactScoreCorrect"]) for row in backtest[24:]),
        "比分留出测试命中数不一致",
    )
    require(
        meta["knockoutIndividualTeamWithinOneCorrect"] == individual_team_within_one,
        "单队误差不超过 1 球的计数不一致",
    )
    require(
        meta["knockoutBothTeamsWithinOneCorrect"] == both_teams_within_one,
        "完整比分误差不超过 1 球的计数不一致",
    )
    require(
        math.isclose(
            meta["knockoutIndividualTeamWithinOneAccuracy"],
            individual_team_within_one / (len(backtest) * 2),
            abs_tol=1e-4,
        ),
        "单队误差不超过 1 球的比例不一致",
    )
    require(
        math.isclose(
            meta["knockoutBothTeamsWithinOneAccuracy"],
            both_teams_within_one / len(backtest),
            abs_tol=1e-4,
        ),
        "完整比分误差不超过 1 球的比例不一致",
    )
    require(0 <= meta["scoreRecentMatchWeight"] <= 1, "最近 3 场比分权重超出 0-100%")
    require(
        meta["scoreHistoryWeight"] + meta["scorePaceWeight"] < 0.9,
        "历史比分与赛事节奏权重之和过高",
    )
    require(meta["groupScoreCalibrationRows"] == 72, "小组赛校准总样本应为 72 场")
    require(meta["groupScoreCalibrationValidationRows"] == 24, "小组赛校准时间验证应为 24 场")
    require(0 <= meta["scoreGroupCalibrationWeight"] <= 1, "小组赛校准融合权重超出 0-100%")
    selected_group_candidate = min(
        output["groupCalibrationCandidates"],
        key=lambda item: (
            float(item["validationPoissonDeviance"]),
            float(item["validationMae"]),
            -int(item["validationExactCorrect"]),
        ),
    )
    require(
        math.isclose(
            meta["groupScoreCalibrationAlpha"],
            float(selected_group_candidate["alpha"]),
            abs_tol=1e-9,
        ),
        "小组赛校准器正则参数与候选验证结果不一致",
    )
    require(
        meta["groupScoreCalibrationValidationExactCorrect"]
        == int(selected_group_candidate["validationExactCorrect"]),
        "小组赛校准器精确比分计数不一致",
    )
    score_feature_candidates = output["scoreFeatureCandidates"]
    require(
        meta["scoreFeatureCandidatesTested"] == len(score_feature_candidates),
        "比分变量集候选数量不一致",
    )
    selected_score_feature = min(
        score_feature_candidates,
        key=lambda item: (
            float(item["validationPoissonDeviance"]),
            float(item["validationMae"]),
            int(item["featureCount"]),
        ),
    )
    require(
        meta["scoreFeatureSet"] == selected_score_feature["featureSet"],
        "比分变量集与历史时间验证选择不一致",
    )
    require(
        meta["scoreFeatureCount"] == int(selected_score_feature["featureCount"]),
        "比分变量数量不一致",
    )
    require(
        meta["scoreRecencyCandidatesTested"] == len(output["scoreRecencyCandidates"]),
        "历史进球模型候选数量不一致",
    )
    require(meta["scoreRecencyCandidatesTested"] >= 5, "历史进球模型候选不足")
    selected_recency_candidate = min(
        output["scoreRecencyCandidates"],
        key=lambda item: (
            float(item["validationPoissonDeviance"]),
            float(item["validationMae"]),
            -int(item["validationExactCorrect"]),
            abs(float(item["halfLifeYears"]) - 2.0),
        ),
    )
    require(
        math.isclose(
            meta["scoreRecencyHalfLifeYears"],
            float(selected_recency_candidate["halfLifeYears"]),
            abs_tol=1e-9,
        ),
        "历史进球时间衰减参数与候选验证结果不一致",
    )
    require(
        meta["scoreModelFamily"] == selected_recency_candidate["modelFamily"],
        "历史进球模型结构与候选验证结果不一致",
    )
    require(meta["historicalScoreValidationPoissonDeviance"] > 0, "最终历史比分泊松偏差无效")
    require(meta["historicalScoreValidationJointLogLoss"] > 0, "最终历史联合比分损失无效")
    score_distribution_candidates = output["scoreDistributionCandidates"]
    require(
        meta["scoreDistributionCandidatesTested"] == len(score_distribution_candidates),
        "比分分布候选数量不一致",
    )
    best_distribution_loss = min(
        float(item["tuningJointLogLoss"]) for item in score_distribution_candidates
    )
    stable_distributions = [
        item for item in score_distribution_candidates
        if float(item["tuningJointLogLoss"]) <= best_distribution_loss + 0.001
    ]
    selected_distribution = min(
        stable_distributions,
        key=lambda item: (
            float(item["tuningJointLogLoss"]),
            -int(item["tuningExactCorrect"]),
            0 if item["distributionFamily"] == "independent-poisson" else 1,
        ),
    )
    require(
        meta["scoreDistributionFamily"] == selected_distribution["distributionFamily"],
        "比分概率分布与历史调参结果不一致",
    )
    require(
        math.isclose(
            meta["scoreLowScoreCorrelationRho"],
            float(selected_distribution["lowScoreCorrelationRho"]),
            abs_tol=1e-9,
        ),
        "Dixon-Coles 低比分相关参数不一致",
    )
    require(
        math.isclose(
            meta["scoreSharedGoalRate"],
            float(selected_distribution["sharedGoalRate"]),
            abs_tol=1e-9,
        ),
        "双变量泊松共同进球参数不一致",
    )

    for scheduled in output.get("scheduledMatchPredictions", []):
        score = scheduled["scorePrediction"]
        require(
            score["finalTeamAScore"]
            == score["regulationTeamAScore"] + score["extraTimeTeamAScore"],
            f"待赛 M{scheduled['matchNumber']} 主队比分结构不一致",
        )
        require(
            score["finalTeamBScore"]
            == score["regulationTeamBScore"] + score["extraTimeTeamBScore"],
            f"待赛 M{scheduled['matchNumber']} 客队比分结构不一致",
        )
        if score["decidedBy"] == "penalties":
            require(
                score["finalTeamAScore"] == score["finalTeamBScore"],
                f"待赛 M{scheduled['matchNumber']} 点球标记必须对应 120 分钟平局",
            )
        require(
            score["distributionFamily"] == meta["scoreDistributionFamily"],
            f"待赛 M{scheduled['matchNumber']} 比分分布与模型元数据不一致",
        )

    print("数据与模型完整性检查通过")
    print(f"- 已结束比赛：{len(matches)}")
    print(f"- 晋级者顺序回放：{advance_correct}/28 = {advance_correct / 28:.1%}")
    print(f"- 胜/平/负顺序回放：{one_x_two_correct}/28 = {one_x_two_correct / 28:.1%}")
    print(
        f"- 开发回放：{meta['knockoutDevelopmentCorrect']}/24 = "
        f"{meta['knockoutDevelopmentAccuracy']:.1%}"
    )
    print(
        f"- 后续诊断时间片：{meta['knockoutHoldoutCorrect']}/4 = "
        f"{meta['knockoutHoldoutAccuracy']:.1%}（样本很小，未进入自动选参）"
    )
    print(
        f"- 历史训练截断：{meta['historicalTrainingDataCutoff']}；"
        f"开赛日起源文件共有 {meta['historicalSourceRowsOnOrAfterStart']} 行，"
        f"其中带比分 {meta['scoredHistoricalRowsOnOrAfterStart']} 行，均未进入历史训练"
    )
    print(
        "- 全局权重："
        f"赛前 {meta['advancementPriorWeight']:.0%} / "
        f"本届状态 {meta['advancementFormWeight']:.0%} / "
        f"分类器 {meta['advancementClassifierWeight']:.0%} / "
        f"环境 {meta['advancementEnvironmentWeight']:.0%}"
    )
    print(
        f"- 精确比分：{exact_score_correct}/{len(backtest)} = "
        f"{exact_score_correct / len(backtest):.1%}；每队平均误差 {meta['knockoutScoreMae']:.2f} 球"
    )
    print(
        f"- 单队误差不超过 1 球：{individual_team_within_one}/{len(backtest) * 2} = "
        f"{individual_team_within_one / (len(backtest) * 2):.1%}"
    )
    print(
        f"- 双方均误差不超过 1 球：{both_teams_within_one}/{len(backtest)} = "
        f"{both_teams_within_one / len(backtest):.1%}"
    )
    print(
        "- 小组赛时效校准："
        f"历史基线 MAE {meta['groupScoreBaselineValidationMae']:.2f} / "
        f"校准器 {meta['groupScoreCalibrationValidationMae']:.2f}；"
        f"淘汰赛融合权重 {meta['scoreGroupCalibrationWeight']:.0%}"
    )
    print(
        f"- 历史进球时间衰减：{meta['scoreRecencyHalfLifeYears']:.1f} 年半衰期；"
        f"时间外泊松偏差 {meta['historicalScoreValidationPoissonDeviance']:.3f}"
    )
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (AssertionError, KeyError, ValueError) as exc:
        print(f"数据与模型完整性检查失败：{exc}")
        sys.exit(1)
