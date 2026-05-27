import type { Language } from "../i18n";
import type { BracketPredictionState, DataQuality, GroupCode, Player, PredictionStage, Team } from "../types/worldCup";
import { getChampionId } from "./bracket";

export type TeamStyleTag =
  | "possession"
  | "counter"
  | "physical"
  | "defensive-counter"
  | "high-press"
  | "wing-backs"
  | "youth"
  | "giant"
  | "tournament"
  | "dark-horse";

export type RegionKey = "north-america" | "south-america" | "europe" | "africa" | "asia" | "oceania";

export interface WinProbability {
  teamA: number;
  teamB: number;
  modelNotes: Array<"strengthScore" | "strengthRank" | "predictedStage" | "squadValue">;
}

export interface ExplanationPoint {
  key: "strengthScore" | "strengthRank" | "squadValue" | "corePlayers" | "predictedStage";
  emphasis: "positive" | "neutral";
  value: string;
}

export interface QualitySummaryRow {
  key: DataQuality;
  count: number;
}

export interface PhotoSummary {
  realThumbnails: number;
  manualPhotos: number;
  placeholderPhotos: number;
  missingManualCandidates: Player[];
}

export interface GlossaryTerm {
  id: string;
  title: Record<Language, string>;
  description: Record<Language, string>;
}

export interface WatchMatchInsight {
  id: string;
  group: GroupCode;
  teamA: Team;
  teamB: Team;
  angle: Record<Language, string>;
  whyWatch: Record<Language, string>;
}

export interface GroupDifficulty {
  group: GroupCode;
  averageStrengthRank: number;
  averageStrengthScore: number;
  topTeam: Team;
}

const stageStrength: Record<PredictionStage, number> = {
  Champion: 1,
  Final: 0.88,
  "Semi-final": 0.76,
  "Quarter-final": 0.64,
  "Round of 16": 0.5,
  "Round of 32": 0.38,
  "Group Stage": 0.22,
};

const regionByTeamId: Record<string, RegionKey> = {
  mexico: "north-america",
  "south-africa": "africa",
  "south-korea": "asia",
  czechia: "europe",
  canada: "north-america",
  "bosnia-herzegovina": "europe",
  qatar: "asia",
  switzerland: "europe",
  brazil: "south-america",
  morocco: "africa",
  haiti: "north-america",
  scotland: "europe",
  usa: "north-america",
  turkiye: "europe",
  australia: "oceania",
  paraguay: "south-america",
  germany: "europe",
  curacao: "north-america",
  "cote-divoire": "africa",
  ecuador: "south-america",
  netherlands: "europe",
  japan: "asia",
  sweden: "europe",
  tunisia: "africa",
  belgium: "europe",
  iran: "asia",
  egypt: "africa",
  "new-zealand": "oceania",
  spain: "europe",
  "cape-verde": "africa",
  "saudi-arabia": "asia",
  uruguay: "south-america",
  france: "europe",
  senegal: "africa",
  norway: "europe",
  iraq: "asia",
  argentina: "south-america",
  algeria: "africa",
  austria: "europe",
  jordan: "asia",
  portugal: "europe",
  colombia: "south-america",
  uzbekistan: "asia",
  "dr-congo": "africa",
  england: "europe",
  croatia: "europe",
  ghana: "africa",
  panama: "north-america",
};

const manualPhotoSources = new Set(["manual", "club_website", "national_team_website", "fifa"]);
const orderedQualityKeys: DataQuality[] = ["official", "official-placeholder", "estimated", "projected", "mock", "manual"];

const styleTagMap: Record<string, TeamStyleTag[]> = {
  spain: ["possession", "youth", "giant"],
  argentina: ["possession", "tournament", "giant"],
  france: ["counter", "physical", "giant"],
  brazil: ["possession", "counter", "giant"],
  england: ["high-press", "physical", "giant"],
  portugal: ["possession", "youth", "giant"],
  germany: ["high-press", "youth", "giant"],
  netherlands: ["possession", "wing-backs", "giant"],
  japan: ["counter", "high-press", "youth"],
  morocco: ["defensive-counter", "wing-backs", "dark-horse"],
  usa: ["high-press", "physical", "dark-horse"],
  mexico: ["counter", "tournament"],
  uruguay: ["high-press", "physical", "tournament"],
  colombia: ["counter", "dark-horse"],
  switzerland: ["defensive-counter", "tournament"],
  belgium: ["possession", "tournament"],
  croatia: ["possession", "tournament"],
  australia: ["physical", "defensive-counter"],
  "saudi-arabia": ["counter", "high-press"],
  qatar: ["defensive-counter", "tournament"],
};

const defaultStyleTags = (team: Team): TeamStyleTag[] => {
  const tags = new Set<TeamStyleTag>();

  if (team.strengthRank <= 8) tags.add("giant");
  if (team.isDarkHorse) tags.add("dark-horse");
  if (team.strengthScore >= 82) tags.add("possession");
  else if (team.strengthScore >= 72) tags.add("counter");
  else tags.add("defensive-counter");
  if ((team.formation ?? "").includes("3-")) tags.add("wing-backs");
  if (team.strengthRank <= 20 && team.predictedStage !== "Group Stage") tags.add("tournament");

  return Array.from(tags);
};

const sigmoid = (value: number) => 1 / (1 + Math.exp(-value));

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const getTeamStyleTags = (team: Team) => styleTagMap[team.id] ?? defaultStyleTags(team);

export const getTeamRegion = (teamId: string): RegionKey => regionByTeamId[teamId] ?? "europe";

export const getBeginnerFriendlyRating = (team: Team, players: Player[]) => {
  const keyPlayers = players.filter((player) => player.teamId === team.id && player.isKeyPlayer).length;
  const styleCount = getTeamStyleTags(team).length;
  const starPower = Math.min(20, keyPlayers * 4);
  const strengthSignal = team.strengthScore >= 78 ? 18 : team.strengthScore >= 68 ? 12 : 7;
  const storySignal = team.isDarkHorse ? 12 : team.strengthRank <= 12 ? 14 : 8;
  const claritySignal = styleCount >= 3 ? 14 : 10;

  return clamp(Math.round(34 + starPower + strengthSignal + storySignal + claritySignal), 45, 98);
};

export const getHardestGroup = (groups: Array<{ code: GroupCode; teamIds: string[] }>, teams: Team[]): GroupDifficulty | null => {
  const rows = groups
    .map((group) => {
      const groupTeams = group.teamIds
        .map((teamId) => teams.find((team) => team.id === teamId))
        .filter((team): team is Team => Boolean(team));

      if (groupTeams.length === 0) return null;

      return {
        group: group.code,
        averageStrengthRank: groupTeams.reduce((sum, team) => sum + team.strengthRank, 0) / groupTeams.length,
        averageStrengthScore: groupTeams.reduce((sum, team) => sum + team.strengthScore, 0) / groupTeams.length,
        topTeam: [...groupTeams].sort((a, b) => a.strengthRank - b.strengthRank)[0],
      };
    })
    .filter((row): row is GroupDifficulty => Boolean(row));

  return rows.sort((a, b) => a.averageStrengthRank - b.averageStrengthRank)[0] ?? null;
};

export const getWinProbability = (teamA: Team | undefined, teamB: Team | undefined): WinProbability | null => {
  if (!teamA || !teamB) return null;

  const scoreEdge = (teamA.strengthScore - teamB.strengthScore) * 1.45;
  const rankEdge = (teamB.strengthRank - teamA.strengthRank) * 0.95;
  const stageEdge = (stageStrength[teamA.predictedStage] - stageStrength[teamB.predictedStage]) * 24;
  const squadEdge = ((teamA.squadValueEurM ?? 0) - (teamB.squadValueEurM ?? 0)) / 24;
  const raw = (scoreEdge + rankEdge + stageEdge + squadEdge) / 17;
  const teamAProbability = clamp(sigmoid(raw), 0.08, 0.92);

  const contributions = [
    { key: "strengthScore", value: Math.abs(scoreEdge) },
    { key: "strengthRank", value: Math.abs(rankEdge) },
    { key: "predictedStage", value: Math.abs(stageEdge) },
    { key: "squadValue", value: Math.abs(squadEdge) },
  ]
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((item) => item.key) as WinProbability["modelNotes"];

  return {
    teamA: teamAProbability,
    teamB: 1 - teamAProbability,
    modelNotes: contributions,
  };
};

export const getTeamExplanation = (team: Team, players: Player[]): ExplanationPoint[] => {
  const corePlayers = players.filter((player) => player.teamId === team.id && player.isKeyPlayer);

  return [
    {
      key: "strengthScore",
      emphasis: team.strengthScore >= 78 ? "positive" : "neutral",
      value: `${team.strengthScore}`,
    },
    {
      key: "strengthRank",
      emphasis: team.strengthRank <= 16 ? "positive" : "neutral",
      value: `#${team.strengthRank}`,
    },
    {
      key: "squadValue",
      emphasis: (team.squadValueEurM ?? 0) >= 300 ? "positive" : "neutral",
      value: team.squadValue ?? "N/A",
    },
    {
      key: "corePlayers",
      emphasis: corePlayers.length >= 4 ? "positive" : "neutral",
      value: `${corePlayers.length}`,
    },
    {
      key: "predictedStage",
      emphasis: team.predictedStage !== "Group Stage" ? "positive" : "neutral",
      value: team.predictedStage,
    },
  ];
};

export const getTopTeamPlayers = (teamId: string, players: Player[], limit = 3) =>
  players
    .filter((player) => player.teamId === teamId)
    .sort((a, b) => {
      if (Number(b.isKeyPlayer) !== Number(a.isKeyPlayer)) return Number(b.isKeyPlayer) - Number(a.isKeyPlayer);
      if (b.marketValueEurM !== a.marketValueEurM) return b.marketValueEurM - a.marketValueEurM;
      return Number(b.predictedStarter) - Number(a.predictedStarter);
    })
    .slice(0, limit);

export const summarizeDataQuality = (teams: Team[], players: Player[]): QualitySummaryRow[] => {
  const counts = new Map<DataQuality, number>();

  [...teams.map((team) => team.dataQuality), ...players.map((player) => player.dataQuality)].forEach((quality) => {
    counts.set(quality, (counts.get(quality) ?? 0) + 1);
  });

  return orderedQualityKeys.map((key) => ({
    key,
    count: counts.get(key) ?? 0,
  }));
};

export const summarizePhotos = (players: Player[]): PhotoSummary => {
  const realThumbnails = players.filter((player) => player.photoSource === "wikimedia").length;
  const manualPhotos = players.filter((player) => manualPhotoSources.has(player.photoSource ?? "placeholder")).length;
  const placeholderPhotos = players.filter((player) => !player.photoSource || player.photoSource === "placeholder").length;
  const missingManualCandidates = players
    .filter((player) => !player.photoSource || player.photoSource === "placeholder" || player.photoSource === "wikimedia")
    .sort((a, b) => {
      if (Number(b.isKeyPlayer) !== Number(a.isKeyPlayer)) return Number(b.isKeyPlayer) - Number(a.isKeyPlayer);
      return b.marketValueEurM - a.marketValueEurM;
    });

  return {
    realThumbnails,
    manualPhotos,
    placeholderPhotos,
    missingManualCandidates,
  };
};

export const glossaryTerms: GlossaryTerm[] = [
  {
    id: "possession",
    title: { zh: "控球", en: "Possession" },
    description: {
      zh: "指一支球队把球控制在脚下的时间和能力。控球多不一定赢，但通常意味着能按自己的节奏组织进攻。",
      en: "How much a team keeps the ball and controls tempo. More possession does not guarantee a win, but it often means more control over the game.",
    },
  },
  {
    id: "high-press",
    title: { zh: "高位逼抢", en: "High Press" },
    description: {
      zh: "前场球员在离对方球门很近的位置就开始抢球，想尽快制造失误。新手可以重点看谁先逼抢、谁被迫回传。",
      en: "Defending aggressively near the opponent's goal to force mistakes early. Watch who closes down first and who is forced to pass backward.",
    },
  },
  {
    id: "counter",
    title: { zh: "反击", en: "Counterattack" },
    description: {
      zh: "抢到球后快速向前推进，利用对手阵型还没站稳的空当。速度型边锋和前锋最适合这种打法。",
      en: "Breaking forward quickly after winning the ball, before the opponent resets shape. Fast wingers and forwards thrive here.",
    },
  },
  {
    id: "low-block",
    title: { zh: "低位防守", en: "Low Block" },
    description: {
      zh: "全队站得比较靠后，先保护禁区，再等机会反击。看点通常是防线是否紧凑、能不能顶住连续传中。",
      en: "A deep defensive shape that protects the box first and counters later. Watch compact spacing and how the team handles crosses.",
    },
  },
  {
    id: "full-back",
    title: { zh: "边后卫", en: "Full-back" },
    description: {
      zh: "站在后防线两侧的球员，既要防守边路，也常常参与助攻。现代强队的边后卫经常是推进和传中的发动机。",
      en: "Wide defenders who must both defend the flank and support attacks. In modern football they often drive buildup and crossing.",
    },
  },
  {
    id: "goal-difference",
    title: { zh: "净胜球", en: "Goal Difference" },
    description: {
      zh: "进球数减去失球数。小组赛积分相同时，净胜球常常决定谁排名更高。",
      en: "Goals scored minus goals conceded. It is often a key tiebreaker when group-stage points are equal.",
    },
  },
  {
    id: "best-third",
    title: { zh: "最好第三名", en: "Best Third-place Team" },
    description: {
      zh: "2026 世界杯 12 个小组里，成绩最好的 8 个第三名也能出线。所以第三名球队每一分、每一个净胜球都很关键。",
      en: "In the 2026 format, the eight best third-place teams also advance. That makes every point and every goal difference swing important.",
    },
  },
];

export const getWatchGuide = (groups: Array<{ code: GroupCode; teamIds: string[] }>, teams: Team[]): WatchMatchInsight[] =>
  groups.flatMap((group) => {
    const groupTeams = group.teamIds
      .map((teamId) => teams.find((team) => team.id === teamId))
      .filter((team): team is Team => Boolean(team))
      .sort((a, b) => a.strengthRank - b.strengthRank);

    if (groupTeams.length < 2) return [];

    const firstTeam = groupTeams[0];
    const secondTeam = groupTeams[1];
    const thirdTeam = groupTeams[2] ?? firstTeam;

    if (!firstTeam || !secondTeam) return [];

    const featured: Array<[Team, Team]> = [
      [firstTeam, secondTeam],
      [secondTeam, thirdTeam],
    ];

    return featured.map(([teamA, teamB], index) => {
      const stylesA = getTeamStyleTags(teamA);
      const stylesB = getTeamStyleTags(teamB);
      const styleClashZh =
        stylesA.includes("high-press") || stylesB.includes("high-press")
          ? "高位逼抢和出球稳定性"
          : stylesA.includes("possession") || stylesB.includes("possession")
            ? "传控耐心和防守站位"
            : "反击速度和身体对抗";
      const styleClashEn =
        stylesA.includes("high-press") || stylesB.includes("high-press")
          ? "pressing pressure and buildup stability"
          : stylesA.includes("possession") || stylesB.includes("possession")
            ? "possession patience and defensive spacing"
            : "counter speed and physical duels";

      return {
        id: `${group.code}-${index + 1}`,
        group: group.code,
        teamA,
        teamB,
        angle: {
          zh:
            index === 0
              ? "大概率决定小组头名的正面对话。"
              : "可能直接影响出线线和最好第三名竞争。",
          en:
            index === 0
              ? "Likely to shape the race for first place in the group."
              : "Could directly affect qualification and the best-third battle.",
        },
        whyWatch: {
          zh: `重点看 ${styleClashZh}，以及谁能更好地把握转换进攻和边路空间。`,
          en: `Watch the battle around ${styleClashEn}, especially which side uses transitions and wide spaces more efficiently.`,
        },
      };
    });
  });

export const buildPosterExport = (teams: Team[], players: Player[], bracketState: BracketPredictionState) => {
  const champion = teams.find((team) => team.id === getChampionId(bracketState)) ?? teams.find((team) => team.predictedStage === "Champion");
  const finalists = teams.filter((team) => ["Champion", "Final"].includes(team.predictedStage)).slice(0, 2);
  const darkHorses = teams.filter((team) => team.isDarkHorse).slice(0, 4);

  return {
    generatedAt: new Date().toISOString(),
    champion: champion
      ? {
          id: champion.id,
          name: champion.name,
          strengthRank: champion.strengthRank,
          strengthScore: champion.strengthScore,
        }
      : null,
    finalists: finalists.map((team) => ({
      id: team.id,
      name: team.name,
      predictedStage: team.predictedStage,
    })),
    darkHorses: darkHorses.map((team) => ({
      id: team.id,
      name: team.name,
    })),
    spotlightPlayers: champion ? getTopTeamPlayers(champion.id, players).map((player) => player.name) : [],
  };
};

export const buildPosterHtml = (teams: Team[], players: Player[], bracketState: BracketPredictionState) => {
  const payload = buildPosterExport(teams, players, bracketState);
  const championName = payload.champion?.name ?? "TBD";
  const playerLine = payload.spotlightPlayers.join(" • ") || "TBD";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>World Cup Predictor Poster</title>
    <style>
      body { margin: 0; font-family: Arial, sans-serif; background: radial-gradient(circle at top, #1e293b, #020617 70%); color: #f8fafc; }
      .poster { max-width: 960px; margin: 0 auto; padding: 48px 32px 64px; }
      .kicker { letter-spacing: .3em; text-transform: uppercase; color: #facc15; font-weight: 700; font-size: 12px; }
      h1 { font-size: 52px; margin: 12px 0 8px; }
      .hero { border: 1px solid rgba(250, 204, 21, .35); border-radius: 28px; padding: 28px; background: rgba(15, 23, 42, .7); }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 24px; }
      .card { border-radius: 20px; padding: 20px; background: rgba(30, 41, 59, .72); border: 1px solid rgba(148, 163, 184, .18); }
      .label { color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: .12em; }
      .value { font-size: 26px; font-weight: 800; margin-top: 10px; }
    </style>
  </head>
  <body>
    <main class="poster">
      <section class="hero">
        <div class="kicker">2026 FIFA World Cup Predictor</div>
        <h1>${championName}</h1>
        <p>Champion pick based on strength score, strength rank, projected stage, and squad value.</p>
      </section>
      <section class="grid">
        <article class="card">
          <div class="label">Finalists</div>
          <div class="value">${payload.finalists.map((team) => team.name).join(" vs ") || "TBD"}</div>
        </article>
        <article class="card">
          <div class="label">Dark Horses</div>
          <div class="value">${payload.darkHorses.map((team) => team.name).join(", ") || "TBD"}</div>
        </article>
        <article class="card">
          <div class="label">Key Players</div>
          <div class="value">${playerLine}</div>
        </article>
      </section>
      <pre class="card" style="margin-top:24px; white-space:pre-wrap;">${JSON.stringify(payload, null, 2)}</pre>
    </main>
  </body>
</html>`;
};
