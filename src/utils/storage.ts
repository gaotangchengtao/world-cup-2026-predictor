export const storageKeys = {
  theme: "wc2026.theme",
  mode: "wc2026.mode",
  experienceMode: "wc2026.experienceMode",
  overviewSection: "wc2026.overview.section",
  bracketPredictions: "wc2026.bracket.predictions",
  bracketPredictionVersion: "wc2026.bracket.predictionVersion",
  groupStagePredictions: "wc2026.groupStage.predictions",
  groupStagePredictionVersion: "wc2026.groupStage.predictionVersion",
  runtimeData: "wc2026.runtimeData",
  runtimeDataVersion: "wc2026.runtimeDataVersion",
};

export const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};
