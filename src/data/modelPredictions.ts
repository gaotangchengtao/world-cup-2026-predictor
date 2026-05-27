import type { ModelPredictionProfile, PredictionModelMeta } from "../types/worldCup";

export const predictionModelMeta: PredictionModelMeta = {
  "modelName": "Logistic Regression Baseline",
  "trainedAt": "2026-05-27T10:47:02+00:00",
  "trainingDataCutoff": "2026-03-31",
  "dataSources": [
    "D:\\世界杯历史资料\\results.csv",
    "All scored international matches in input CSV",
    "Project team strength data",
    "Projected squad and market-value fields"
  ],
  "validationAccuracy": 0.5945,
  "notes": "Trained on 49215 scored matches with FIFA World Cup final tournament matches weighted highest. Baseline validation accuracy: 0.595. Selected model validation accuracy: 0.595."
};

export const modelPredictionProfiles: ModelPredictionProfile[] = [
  {
    "teamId": "mexico",
    "mlStrengthScore": 73,
    "recentFormScore": 47,
    "attackTrend": 37,
    "defenseTrend": 67,
    "confidenceScore": 67,
    "upsetRisk": "medium",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "south-africa",
    "mlStrengthScore": 57,
    "recentFormScore": 52,
    "attackTrend": 50,
    "defenseTrend": 63,
    "confidenceScore": 56,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "south-korea",
    "mlStrengthScore": 72,
    "recentFormScore": 65,
    "attackTrend": 50,
    "defenseTrend": 60,
    "confidenceScore": 68,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "czechia",
    "mlStrengthScore": 64,
    "recentFormScore": 57,
    "attackTrend": 60,
    "defenseTrend": 60,
    "confidenceScore": 60,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "canada",
    "mlStrengthScore": 69,
    "recentFormScore": 61,
    "attackTrend": 37,
    "defenseTrend": 87,
    "confidenceScore": 69,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "bosnia-herzegovina",
    "mlStrengthScore": 58,
    "recentFormScore": 59,
    "attackTrend": 70,
    "defenseTrend": 63,
    "confidenceScore": 57,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "qatar",
    "mlStrengthScore": 54,
    "recentFormScore": 20,
    "attackTrend": 30,
    "defenseTrend": 37,
    "confidenceScore": 45,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "switzerland",
    "mlStrengthScore": 78,
    "recentFormScore": 80,
    "attackTrend": 83,
    "defenseTrend": 73,
    "confidenceScore": 76,
    "upsetRisk": "medium",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "brazil",
    "mlStrengthScore": 86,
    "recentFormScore": 63,
    "attackTrend": 60,
    "defenseTrend": 73,
    "confidenceScore": 79,
    "upsetRisk": "low",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "morocco",
    "mlStrengthScore": 83,
    "recentFormScore": 88,
    "attackTrend": 60,
    "defenseTrend": 83,
    "confidenceScore": 83,
    "upsetRisk": "medium",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "haiti",
    "mlStrengthScore": 50,
    "recentFormScore": 44,
    "attackTrend": 40,
    "defenseTrend": 63,
    "confidenceScore": 49,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "scotland",
    "mlStrengthScore": 65,
    "recentFormScore": 57,
    "attackTrend": 60,
    "defenseTrend": 60,
    "confidenceScore": 60,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "usa",
    "mlStrengthScore": 75,
    "recentFormScore": 54,
    "attackTrend": 57,
    "defenseTrend": 47,
    "confidenceScore": 67,
    "upsetRisk": "medium",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "turkiye",
    "mlStrengthScore": 77,
    "recentFormScore": 78,
    "attackTrend": 70,
    "defenseTrend": 53,
    "confidenceScore": 72,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "australia",
    "mlStrengthScore": 72,
    "recentFormScore": 74,
    "attackTrend": 50,
    "defenseTrend": 70,
    "confidenceScore": 71,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "paraguay",
    "mlStrengthScore": 66,
    "recentFormScore": 47,
    "attackTrend": 33,
    "defenseTrend": 67,
    "confidenceScore": 61,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "germany",
    "mlStrengthScore": 86,
    "recentFormScore": 77,
    "attackTrend": 77,
    "defenseTrend": 63,
    "confidenceScore": 80,
    "upsetRisk": "low",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "curacao",
    "mlStrengthScore": 48,
    "recentFormScore": 45,
    "attackTrend": 53,
    "defenseTrend": 57,
    "confidenceScore": 47,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "cote-divoire",
    "mlStrengthScore": 72,
    "recentFormScore": 81,
    "attackTrend": 67,
    "defenseTrend": 77,
    "confidenceScore": 73,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "ecuador",
    "mlStrengthScore": 72,
    "recentFormScore": 48,
    "attackTrend": 23,
    "defenseTrend": 87,
    "confidenceScore": 68,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "netherlands",
    "mlStrengthScore": 88,
    "recentFormScore": 94,
    "attackTrend": 98,
    "defenseTrend": 80,
    "confidenceScore": 86,
    "upsetRisk": "low",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "japan",
    "mlStrengthScore": 79,
    "recentFormScore": 73,
    "attackTrend": 60,
    "defenseTrend": 77,
    "confidenceScore": 76,
    "upsetRisk": "medium",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "sweden",
    "mlStrengthScore": 65,
    "recentFormScore": 45,
    "attackTrend": 53,
    "defenseTrend": 40,
    "confidenceScore": 57,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "tunisia",
    "mlStrengthScore": 60,
    "recentFormScore": 49,
    "attackTrend": 47,
    "defenseTrend": 67,
    "confidenceScore": 58,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "belgium",
    "mlStrengthScore": 83,
    "recentFormScore": 88,
    "attackTrend": 98,
    "defenseTrend": 67,
    "confidenceScore": 80,
    "upsetRisk": "medium",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "iran",
    "mlStrengthScore": 57,
    "recentFormScore": 40,
    "attackTrend": 40,
    "defenseTrend": 60,
    "confidenceScore": 55,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "egypt",
    "mlStrengthScore": 63,
    "recentFormScore": 63,
    "attackTrend": 43,
    "defenseTrend": 73,
    "confidenceScore": 62,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "new-zealand",
    "mlStrengthScore": 51,
    "recentFormScore": 20,
    "attackTrend": 30,
    "defenseTrend": 50,
    "confidenceScore": 44,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "spain",
    "mlStrengthScore": 94,
    "recentFormScore": 94,
    "attackTrend": 98,
    "defenseTrend": 73,
    "confidenceScore": 89,
    "upsetRisk": "low",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "cape-verde",
    "mlStrengthScore": 56,
    "recentFormScore": 61,
    "attackTrend": 57,
    "defenseTrend": 67,
    "confidenceScore": 56,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "saudi-arabia",
    "mlStrengthScore": 59,
    "recentFormScore": 41,
    "attackTrend": 30,
    "defenseTrend": 57,
    "confidenceScore": 55,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "uruguay",
    "mlStrengthScore": 78,
    "recentFormScore": 54,
    "attackTrend": 33,
    "defenseTrend": 70,
    "confidenceScore": 73,
    "upsetRisk": "medium",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "france",
    "mlStrengthScore": 95,
    "recentFormScore": 93,
    "attackTrend": 90,
    "defenseTrend": 63,
    "confidenceScore": 88,
    "upsetRisk": "low",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "senegal",
    "mlStrengthScore": 79,
    "recentFormScore": 95,
    "attackTrend": 83,
    "defenseTrend": 80,
    "confidenceScore": 80,
    "upsetRisk": "medium",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "norway",
    "mlStrengthScore": 77,
    "recentFormScore": 92,
    "attackTrend": 98,
    "defenseTrend": 80,
    "confidenceScore": 77,
    "upsetRisk": "medium",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "iraq",
    "mlStrengthScore": 58,
    "recentFormScore": 69,
    "attackTrend": 37,
    "defenseTrend": 77,
    "confidenceScore": 60,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "argentina",
    "mlStrengthScore": 93,
    "recentFormScore": 96,
    "attackTrend": 83,
    "defenseTrend": 87,
    "confidenceScore": 91,
    "upsetRisk": "low",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "algeria",
    "mlStrengthScore": 72,
    "recentFormScore": 87,
    "attackTrend": 77,
    "defenseTrend": 83,
    "confidenceScore": 74,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "austria",
    "mlStrengthScore": 78,
    "recentFormScore": 97,
    "attackTrend": 93,
    "defenseTrend": 83,
    "confidenceScore": 80,
    "upsetRisk": "medium",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "jordan",
    "mlStrengthScore": 56,
    "recentFormScore": 60,
    "attackTrend": 67,
    "defenseTrend": 50,
    "confidenceScore": 54,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "portugal",
    "mlStrengthScore": 87,
    "recentFormScore": 80,
    "attackTrend": 87,
    "defenseTrend": 67,
    "confidenceScore": 81,
    "upsetRisk": "low",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "colombia",
    "mlStrengthScore": 79,
    "recentFormScore": 67,
    "attackTrend": 70,
    "defenseTrend": 67,
    "confidenceScore": 73,
    "upsetRisk": "medium",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "uzbekistan",
    "mlStrengthScore": 60,
    "recentFormScore": 61,
    "attackTrend": 50,
    "defenseTrend": 77,
    "confidenceScore": 60,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "dr-congo",
    "mlStrengthScore": 61,
    "recentFormScore": 82,
    "attackTrend": 40,
    "defenseTrend": 90,
    "confidenceScore": 66,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "england",
    "mlStrengthScore": 89,
    "recentFormScore": 84,
    "attackTrend": 73,
    "defenseTrend": 83,
    "confidenceScore": 86,
    "upsetRisk": "low",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "croatia",
    "mlStrengthScore": 84,
    "recentFormScore": 96,
    "attackTrend": 97,
    "defenseTrend": 73,
    "confidenceScore": 83,
    "upsetRisk": "medium",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "ghana",
    "mlStrengthScore": 61,
    "recentFormScore": 45,
    "attackTrend": 50,
    "defenseTrend": 57,
    "confidenceScore": 57,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  },
  {
    "teamId": "panama",
    "mlStrengthScore": 58,
    "recentFormScore": 60,
    "attackTrend": 43,
    "defenseTrend": 73,
    "confidenceScore": 58,
    "upsetRisk": "high",
    "explanation": "Generated from historical Elo, recent form, goal trends, tournament weighting, and current project squad signals."
  }
];
