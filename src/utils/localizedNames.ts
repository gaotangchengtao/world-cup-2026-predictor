import type { Language } from "../i18n";
import { clubNamesZh, coachNamesZh, playerNamesZh, teamNamesZh } from "../data/localizedNames";
import type { Player, Team } from "../types/worldCup";

export const displayTeamName = (team: Team | undefined, language: Language) => {
  if (!team) return "";
  return language === "zh" ? teamNamesZh[team.id] ?? team.name : team.name;
};

export const displayPlayerName = (player: Player | undefined, language: Language) => {
  if (!player) return "";
  return language === "zh" ? playerNamesZh[player.name] ?? player.name : player.name;
};

export const displayClubName = (club: string | undefined, language: Language) => {
  if (!club) return "";
  return language === "zh" ? clubNamesZh[club] ?? club : club;
};

export const displayCoachName = (coach: string | undefined, language: Language) => {
  if (!coach) return "";
  return language === "zh" ? coachNamesZh[coach] ?? coach : coach;
};

export const teamSearchText = (team: Team) =>
  [team.name, teamNamesZh[team.id], team.coach, coachNamesZh[team.coach ?? ""], team.group]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export const playerSearchText = (player: Player) =>
  [player.name, playerNamesZh[player.name], player.club, clubNamesZh[player.club]]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
