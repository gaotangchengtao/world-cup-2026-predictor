import type { Language } from "../i18n";
import { clubNamesZh, coachNamesZh, playerNamesZh, teamNamesZh } from "../data/localizedNames";
import type { Player, Team } from "../types/worldCup";

export const displayTeamName = (team: Team | undefined, language: Language) => {
  if (!team) return "";
  if (language === "zh") return teamNamesZh[team.id] ?? team.name;
  return team.name;
};

export const displayPlayerName = (player: Player | undefined, language: Language) => {
  if (!player) return "";
  if (language === "zh") return playerNamesZh[player.name] || player.localizedNameZh || player.name;
  return player.name;
};

export const displayClubName = (
  club: string | undefined,
  language: Language,
  localizedClubZh?: string,
) => {
  if (!club) return "";
  if (language === "zh") return clubNamesZh[club] || localizedClubZh || club;
  return club;
};

export const displayCoachName = (coach: string | undefined, language: Language) => {
  if (!coach) return "";
  if (language === "zh") return coachNamesZh[coach] ?? coach;
  return coach;
};

export const teamSearchText = (team: Team) =>
  [team.name, teamNamesZh[team.id], team.coach, coachNamesZh[team.coach ?? ""], team.group]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export const playerSearchText = (player: Player) =>
  [
    player.name,
    playerNamesZh[player.name],
    player.localizedNameZh,
    player.club,
    clubNamesZh[player.club],
    player.localizedClubZh,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
