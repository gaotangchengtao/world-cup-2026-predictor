import type { Player, PlayerPhotoSource } from "../types/worldCup";
import type { TranslationKey } from "../i18n";

type Translator = (key: TranslationKey) => string;

export const placeholderAvatarUrl = (name = "Player") =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f172a&color=f8fafc&bold=true&size=160`;

export const getPlayerPhotoUrl = (player: Player) => player.photoUrl || placeholderAvatarUrl(player.name);

export const photoSourceLabel = (source: PlayerPhotoSource | undefined, t: Translator) => {
  if (source === "club_website") return t("photoSourceClub");
  if (source === "national_team_website") return t("photoSourceNationalTeam");
  if (source === "fifa") return t("photoSourceFifa");
  if (source === "manual") return t("photoSourceManual");
  if (source === "wikimedia") return t("photoSourceWikimedia");
  return t("photoSourcePlaceholder");
};

const wikipediaCachePrefix = "wc2026.playerPhoto.wikipedia.";

const memoryCache = new Map<string, string | null>();

const cacheKey = (name: string) => `${wikipediaCachePrefix}${name}`;

const getStoredPhoto = (name: string) => {
  try {
    const value = localStorage.getItem(cacheKey(name));
    if (value === "__missing__") return null;
    return value;
  } catch {
    return undefined;
  }
};

const setStoredPhoto = (name: string, value: string | null) => {
  try {
    localStorage.setItem(cacheKey(name), value ?? "__missing__");
  } catch {
    // Ignore storage limits or privacy-mode failures.
  }
};

export const resolveWikipediaThumbnail = async (name: string, signal?: AbortSignal) => {
  if (memoryCache.has(name)) return memoryCache.get(name) ?? undefined;

  const stored = getStoredPhoto(name);
  if (stored !== undefined) {
    memoryCache.set(name, stored);
    return stored ?? undefined;
  }

  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    prop: "pageimages",
    piprop: "thumbnail",
    pithumbsize: "240",
    redirects: "1",
    titles: name,
  });

  try {
    const response = await fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`, { signal });
    if (!response.ok) throw new Error(`Wikipedia image lookup failed: ${response.status}`);

    const data = (await response.json()) as {
      query?: { pages?: Record<string, { thumbnail?: { source?: string } }> };
    };
    const page = Object.values(data.query?.pages ?? {})[0];
    const source = page?.thumbnail?.source;

    memoryCache.set(name, source ?? null);
    setStoredPhoto(name, source ?? null);
    return source;
  } catch {
    if (signal?.aborted) return undefined;
    memoryCache.set(name, null);
    setStoredPhoto(name, null);
    return undefined;
  }
};
