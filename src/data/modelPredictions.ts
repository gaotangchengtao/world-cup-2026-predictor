import type { ModelPredictionProfile, PredictionModelMeta, PredictionRisk } from "../types/worldCup";
import { players } from "./players";
import { teams } from "./teams";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const riskFromRank = (strengthRank: number, confidenceScore: number): PredictionRisk => {
  if (strengthRank <= 8 && confidenceScore >= 76) return "low";
  if (strengthRank <= 20 && confidenceScore >= 62) return "medium";
  return "high";
};

export const predictionModelMeta: PredictionModelMeta = {
  modelName: "Offline ML Baseline v0.1",
  trainedAt: "2026-05-27",
  trainingDataCutoff: "Baseline generated from current project data. Run npm run ml:train after adding historical results.csv.",
  dataSources: [
    "Project team strength data",
    "Projected squad and market-value fields",
    "Historical match CSV placeholder pipeline",
  ],
  validationAccuracy: null,
  notes:
    "This committed baseline keeps the front end stable before a local historical-results CSV is added. The Python training script can overwrite this file with a scikit-learn model export.",
};

export const modelPredictionProfiles: ModelPredictionProfile[] = teams.map((team) => {
  const teamPlayers = players.filter((player) => player.teamId === team.id);
  const keyPlayers = teamPlayers.filter((player) => player.isKeyPlayer).length;
  const starterValue = teamPlayers
    .filter((player) => player.predictedStarter)
    .reduce((sum, player) => sum + player.marketValueEurM, 0);
  const squadValue = team.squadValueEurM ?? starterValue;
  const valueScore = clamp(Math.round((Math.log10(Math.max(1, squadValue)) / Math.log10(1300)) * 100), 28, 96);
  const rankScore = clamp(102 - team.strengthRank * 1.35, 28, 98);
  const keyPlayerScore = clamp(48 + keyPlayers * 7, 42, 92);
  const stageBonus =
    team.predictedStage === "Champion"
      ? 10
      : team.predictedStage === "Final"
        ? 8
        : team.predictedStage === "Semi-final"
          ? 6
          : team.predictedStage === "Quarter-final"
            ? 4
            : team.predictedStage === "Round of 16"
              ? 2
              : 0;
  const mlStrengthScore = clamp(
    Math.round(team.strengthScore * 0.44 + rankScore * 0.2 + valueScore * 0.18 + keyPlayerScore * 0.14 + stageBonus),
    35,
    97,
  );
  const recentFormScore = clamp(Math.round(team.strengthScore * 0.68 + rankScore * 0.22 + stageBonus), 32, 96);
  const attackTrend = clamp(Math.round(valueScore * 0.42 + keyPlayerScore * 0.34 + team.strengthScore * 0.24), 30, 98);
  const defenseTrend = clamp(Math.round(team.strengthScore * 0.52 + rankScore * 0.32 + (team.predictedGroupPosition <= 2 ? 8 : 0)), 30, 98);
  const confidenceScore = clamp(
    Math.round(mlStrengthScore * 0.5 + recentFormScore * 0.24 + defenseTrend * 0.16 + keyPlayerScore * 0.1),
    35,
    95,
  );

  return {
    teamId: team.id,
    mlStrengthScore,
    recentFormScore,
    attackTrend,
    defenseTrend,
    confidenceScore,
    upsetRisk: riskFromRank(team.strengthRank, confidenceScore),
    explanation:
      "Baseline profile generated from strength rank, strength score, projected squad value, key-player count, and predicted tournament stage.",
  };
});
