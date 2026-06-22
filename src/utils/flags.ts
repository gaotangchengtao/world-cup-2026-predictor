import type { Team } from "../types/worldCup";

export const getFlagImageUrl = (team?: Team) =>
  team ? team.flagImageUrl ?? `assets/flags/${team.id}.png` : undefined;
