import type { PlayerPosition, PredictionStage, SquadStatus, Team } from "../types/worldCup";
import type { TranslationKey } from "../i18n";

export const stageOrder: Record<PredictionStage, number> = {
  Champion: 1,
  Final: 2,
  "Semi-final": 3,
  "Quarter-final": 4,
  "Round of 16": 5,
  "Round of 32": 6,
  "Group Stage": 7,
};

type Translator = (key: TranslationKey) => string;

export const stageLabel = (stage: PredictionStage, t: Translator) => {
  const labels: Record<PredictionStage, TranslationKey> = {
    Champion: "stageChampion",
    Final: "stageFinal",
    "Semi-final": "stageSemiFinal",
    "Quarter-final": "stageQuarterFinal",
    "Round of 16": "stageRoundOf16",
    "Round of 32": "stageRoundOf32",
    "Group Stage": "stageGroupStage",
  };

  return t(labels[stage]);
};

export const groupPositionLabel = (position: Team["predictedGroupPosition"], t: Translator) => {
  if (position === 1) return t("groupFirst");
  if (position === 2) return t("groupSecond");
  if (position === 3) return t("groupThird");
  return t("groupEliminated");
};

export const playerPositionLabel = (position: PlayerPosition, t: Translator) => {
  if (position === "GK") return t("positionGoalkeeper");
  if (position === "DF") return t("positionDefender");
  if (position === "MF") return t("positionMidfielder");
  return t("positionForward");
};

export const qualityLabel = (quality: string, t: Translator) => {
  const labels: Record<string, TranslationKey> = {
    official: "qualityOfficial",
    "official-placeholder": "qualityOfficialPlaceholder",
    estimated: "qualityEstimated",
    projected: "qualityProjected",
    mock: "qualityMock",
    manual: "qualityManual",
  };

  return labels[quality] ? t(labels[quality]) : quality;
};

export const squadStatusLabel = (status: SquadStatus | undefined, t: Translator) => {
  const labels: Record<SquadStatus, TranslationKey> = {
    projected: "squadStatusProjected",
    preliminary: "squadStatusPreliminary",
    final: "squadStatusFinal",
  };

  return t(labels[status ?? "projected"]);
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
