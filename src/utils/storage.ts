export const storageKeys = {
  theme: "wc2026.theme",
  mode: "wc2026.mode",
  bracketPredictions: "wc2026.bracket.predictions",
  runtimeData: "wc2026.runtimeData",
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
