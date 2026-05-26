import type { DataSource } from "../types/worldCup";

export const dataSources: DataSource[] = [
  {
    id: "fifa-format",
    label: "FIFA World Cup 26 format",
    url: "https://gpcustomersupportfwc2026.tickets.fifa.com/hc/en-gb/articles/28784798873117-7-What-is-the-format-for-the-FIFA-World-Cup-26-tournament",
    note: "Official FIFA support article for 48 teams, 12 groups, and Round of 32 qualification rules.",
  },
  {
    id: "fifa-draw",
    label: "FIFA Final Draw results",
    url: "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/final-draw-results",
    note: "Official draw reference for group allocation. Some sources still mirror playoff placeholders; local data can be updated manually.",
  },
  {
    id: "fifa-teams",
    label: "FIFA qualified teams",
    url: "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/teams",
    note: "Official team index used for validation when available.",
  },
  {
    id: "manual-transfermarkt",
    label: "Manual Transfermarkt fields",
    url: "https://www.transfermarkt.com/",
    note: "Transfermarkt values and links are stored as manual/projected fields. The app does not scrape Transfermarkt.",
  },
];

export const commonSourceUrls = {
  fifaFormat: dataSources[0].url,
  fifaDraw: dataSources[1].url,
  fifaTeams: dataSources[2].url,
  transfermarkt: dataSources[3].url,
};
