export type GroupCode =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L";

export type PredictionStage =
  | "Champion"
  | "Final"
  | "Semi-final"
  | "Quarter-final"
  | "Round of 16"
  | "Round of 32"
  | "Group Stage";

export type PlayerPosition = "GK" | "DF" | "MF" | "FW";
export type SquadStatus = "projected" | "preliminary" | "final";
export type ExperienceMode = "beginner" | "expert";
export type PredictionRisk = "low" | "medium" | "high";
export type PlayerPhotoSource =
  | "club_website"
  | "national_team_website"
  | "fifa"
  | "manual"
  | "wikimedia"
  | "placeholder";

export type DataQuality =
  | "official"
  | "official-placeholder"
  | "estimated"
  | "projected"
  | "mock"
  | "manual";

export interface DataSource {
  id: string;
  label: string;
  url: string;
  note: string;
}

export interface Team {
  id: string;
  name: string;
  group: GroupCode;
  flag: string;
  flagImageUrl?: string;
  fifaRank?: number;
  strengthRank: number;
  strengthScore: number;
  squadValue?: string;
  squadValueEurM?: number;
  predictedGroupPosition: 1 | 2 | 3 | 4;
  predictedStage: PredictionStage;
  coach?: string;
  formation?: string;
  description?: string;
  beginnerIntro?: string;
  playStyle?: string;
  keyStrengths?: string[];
  weaknesses?: string[];
  playersToWatch?: string[];
  historicalNote?: string;
  whyTheyMatter?: string;
  isDarkHorse?: boolean;
  lastUpdated: string;
  sourceUrls: string[];
  dataQuality: DataQuality;
}

export interface Player {
  playerId: string;
  teamId: string;
  name: string;
  photoUrl?: string;
  photoSource?: PlayerPhotoSource;
  photoCredit?: string;
  photoLastUpdated?: string;
  position: PlayerPosition;
  age?: number;
  club: string;
  marketValue?: string;
  marketValueEurM: number;
  transfermarktUrl?: string;
  isKeyPlayer?: boolean;
  predictedStarter?: boolean;
  shirtNumber?: number;
  squadStatus?: SquadStatus;
  lastUpdated?: string;
  sourceUrls: string[];
  dataQuality: DataQuality;
}

export interface WorldCupGroup {
  code: GroupCode;
  name: string;
  teamIds: string[];
}

export interface GroupMatch {
  id: string;
  group: GroupCode;
  matchday: number;
  homeTeamId: string;
  awayTeamId: string;
}

export interface GroupMatchScore {
  homeScore?: number;
  awayScore?: number;
}

export type GroupStagePredictionState = Record<string, GroupMatchScore>;

export interface GroupStandingRow {
  teamId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: 1 | 2 | 3 | 4;
}

export type SeedType = "winner" | "runner-up" | "best-third" | "manual" | "winner-of";

export interface BracketSlot {
  id: string;
  label: string;
  seedType: SeedType;
  sourceGroup?: GroupCode;
  sourceGroups?: GroupCode[];
  teamId?: string;
}

export interface BracketMatch {
  id: string;
  roundId: string;
  roundName: string;
  matchNumber: number;
  slotA: BracketSlot;
  slotB: BracketSlot;
  nextMatchId?: string;
  nextSlot?: "slotA" | "slotB";
}

export interface BracketRound {
  id: string;
  name: string;
  order: number;
  matches: BracketMatch[];
}

export interface BracketMatchState {
  slotA?: string;
  slotB?: string;
  winnerTeamId?: string;
}

export type BracketPredictionState = Record<string, BracketMatchState>;

export interface RuntimeData {
  teams: Team[];
  players: Player[];
  importedAt?: string;
}

export interface ModelPredictionProfile {
  teamId: string;
  mlStrengthScore: number;
  recentFormScore: number;
  attackTrend: number;
  defenseTrend: number;
  confidenceScore: number;
  upsetRisk: PredictionRisk;
  explanation: string;
}

export interface MatchupPrediction {
  teamAId: string;
  teamBId: string;
  teamAWinProbability: number;
  drawProbability: number;
  teamBWinProbability: number;
  teamAAdvanceProbability: number;
  teamBAdvanceProbability: number;
  topFactors: string[];
  confidenceScore: number;
  upsetRisk: PredictionRisk;
}

export interface PredictionModelMeta {
  modelName: string;
  trainedAt: string;
  trainingDataCutoff: string;
  dataSources: string[];
  validationAccuracy: number | null;
  notes: string;
}

export type OverviewSection = "home" | "groups" | "knockout" | "players" | "beginner" | "stories" | "data";

export type OffFieldStoryCategory =
  | "logistics"
  | "team-camp"
  | "climate"
  | "accessibility"
  | "culture"
  | "governance"
  | "media";

export interface OffFieldStory {
  id: string;
  title: Record<"zh" | "en", string>;
  summary: Record<"zh" | "en", string>;
  whyItMatters: Record<"zh" | "en", string>;
  source: string;
  publishedAt: string;
  url: string;
  category: OffFieldStoryCategory;
  attentionScore: number;
  reliability: "reported" | "official" | "developing";
}

export interface FilterState {
  query: string;
  group: "all" | GroupCode;
  stage: "all" | PredictionStage;
  onlyContenders: boolean;
  onlyDarkHorses: boolean;
  sortBy: "strengthRank" | "squadValue" | "group" | "predictedStage";
  groupSortBy: "strengthRank" | "predictedGroupPosition";
}
