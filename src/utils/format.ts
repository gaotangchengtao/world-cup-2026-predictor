import type { PredictionStage, Team } from "../types/worldCup";

export const stageOrder: Record<PredictionStage, number> = {
  Champion: 1,
  Final: 2,
  "Semi-final": 3,
  "Quarter-final": 4,
  "Round of 16": 5,
  "Round of 32": 6,
  "Group Stage": 7,
};

export const stageLabel = (stage: PredictionStage) => {
  const labels: Record<PredictionStage, string> = {
    Champion: "冠军候选",
    Final: "决赛",
    "Semi-final": "四强",
    "Quarter-final": "八强",
    "Round of 16": "16 强",
    "Round of 32": "32 强",
    "Group Stage": "小组赛出局",
  };

  return labels[stage];
};

export const groupPositionLabel = (position: Team["predictedGroupPosition"]) => {
  if (position === 1) return "小组第一";
  if (position === 2) return "小组第二";
  if (position === 3) return "第三名待定";
  return "淘汰";
};

export const qualityLabel = (quality: string) => {
  const labels: Record<string, string> = {
    official: "官方",
    "official-placeholder": "官方占位",
    estimated: "估算",
    projected: "预测",
    mock: "占位",
    manual: "手动",
  };

  return labels[quality] ?? quality;
};

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);

export const downloadJson = (filename: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const getTeamById = (teams: Team[], teamId?: string) =>
  teamId ? teams.find((team) => team.id === teamId) : undefined;
