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
  isDarkHorse?: boolean;
  lastUpdated: string;
  sourceUrls: string[];
  dataQuality: DataQuality;
}

export interface Player {
  playerId: string;
  teamId: string;
  name: string;
  photoUrl: string;
  position: PlayerPosition;
  age: number;
  club: string;
  marketValue: string;
  marketValueEurM: number;
  transfermarktUrl: string;
  isKeyPlayer: boolean;
  predictedStarter: boolean;
  shirtNumber?: number;
  lastUpdated: string;
  sourceUrls: string[];
  dataQuality: DataQuality;
}

export interface WorldCupGroup {
  code: GroupCode;
  name: string;
  teamIds: string[];
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

export interface FilterState {
  query: string;
  group: "all" | GroupCode;
  stage: "all" | PredictionStage;
  onlyContenders: boolean;
  onlyDarkHorses: boolean;
  sortBy: "strengthRank" | "squadValue" | "group" | "predictedStage";
  groupSortBy: "strengthRank" | "predictedGroupPosition";
}
