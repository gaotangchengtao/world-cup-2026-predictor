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
  return t("photoSourcePlaceholder");
};
