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

    print("数据与模型完整性检查通过")
    print(f"- 已结束比赛：{len(matches)}")
    print(f"- 晋级者顺序回放：{advance_correct}/28 = {advance_correct / 28:.1%}")
    print(f"- 胜/平/负顺序回放：{one_x_two_correct}/28 = {one_x_two_correct / 28:.1%}")
    print(
        f"- 开发回放：{meta['knockoutDevelopmentCorrect']}/24 = "
        f"{meta['knockoutDevelopmentAccuracy']:.1%}"
    )
    print(
        f"- 后续留出：{meta['knockoutHoldoutCorrect']}/4 = "
        f"{meta['knockoutHoldoutAccuracy']:.1%}（样本很小）"
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
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (AssertionError, KeyError, ValueError) as exc:
        print(f"数据与模型完整性检查失败：{exc}")
        sys.exit(1)
