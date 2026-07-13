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
export type MarketValueStatus = "verified" | "estimated" | "stale";
export type PlayerAvailabilityStatus = "available" | "doubtful" | "injured" | "not-selected";
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
  fifaId?: number;
  teamId: string;
  name: string;
  localizedNameZh?: string;
  photoUrl?: string;
  photoSource?: PlayerPhotoSource;
  photoCredit?: string;
  photoLastUpdated?: string;
  position: PlayerPosition;
  dateOfBirth?: string;
  age?: number;
  club: string;
  localizedClubZh?: string;
  heightCm?: number;
  internationalCaps?: number;
  internationalGoals?: number;
  marketValue?: string;
  marketValueEurM: number;
  marketValueLastUpdated?: string;
  marketValueSourceUrl?: string;
  marketValueStatus?: MarketValueStatus;
  transfermarktUrl?: string;
  availabilityStatus?: PlayerAvailabilityStatus;
  availabilityNote?: string;
  availabilityNoteZh?: string;
  isKeyPlayer?: boolean;
  predictedStarter?: boolean;
  shirtNumber?: number;
  squadStatus?: SquadStatus;
  lastUpdated?: string;
  sourceUrls: string[];
  dataQuality: DataQuality;
}

export interface PlayerTournamentStats {
  playerId: string;
  fifaId?: number;
  teamId: string;
  values: Array<number | string | null>;
}

export interface PlayerTournamentStatsSnapshot {
  updatedAt: string;
  competitionId: string;
  sourceUrl: string;
  dataQuality: DataQuality;
  metricKeys: string[];
  players: PlayerTournamentStats[];
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
  actualWinnerTeamId?: string;
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
  tournamentFormScore?: number;
  attackTrend: number;
  defenseTrend: number;
  squadAvailabilityScore?: number;
  tacticalFitScore?: number;
  playerFitScore?: number;
  squadCohesionScore?: number;
  currentSquadSignalScore?: number;
  coachAdaptabilityScore?: number;
  currentMatchCount?: number;
  confidenceScore: number;
  upsetRisk: PredictionRisk;
  keyAbsences?: string[];
  keyAbsencesZh?: string[];
  tacticalNotes?: string[];
  tacticalNotesZh?: string[];
  updatedAt?: string;
  explanation: string;
}

export type ScoreDecision = "regulation" | "extra-time" | "penalties";

export interface MatchScorePrediction {
  expectedTeamAGoals90: number;
  expectedTeamBGoals90: number;
  regulationTeamAScore: number;
  regulationTeamBScore: number;
  extraTimeTeamAScore: number;
  extraTimeTeamBScore: number;
  finalTeamAScore: number;
  finalTeamBScore: number;
  extraTimePlayed: boolean;
  decidedBy: ScoreDecision;
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
  scorePrediction: MatchScorePrediction;
}

export interface ModelMatchupPrediction extends MatchupPrediction {
  matchNumber: number;
  venueId: string;
  temperatureC: number;
  humidityPct: number;
  altitudeM: number;
  teamAEnvironmentReadiness: number;
  teamBEnvironmentReadiness: number;
  teamARestDays: number;
  teamBRestDays: number;
  teamATravelDistanceKm: number;
  teamBTravelDistanceKm: number;
}

export interface PredictionModelMeta {
  modelName: string;
  trainedAt: string;
  trainingDataCutoff: string;
  historicalTrainingDataCutoff?: string;
  currentTournamentStartDate?: string;
  historicalSourceRowsOnOrAfterStart?: number;
  scoredHistoricalRowsOnOrAfterStart?: number;
  dataSources: string[];
  validationAccuracy: number | null;
  rawValidationAccuracy: number | null;
  drawCalibrationThreshold: number;
  knockoutValidationAccuracy: number | null;
  knockoutValidationMatches: number;
  knockoutValidationCorrect: number;
  knockoutValidationStartDate: string;
  knockoutValidationMethod: string;
  knockoutOneXTwoAccuracy: number | null;
  knockoutOneXTwoCorrect: number;
  knockoutDevelopmentAccuracy: number | null;
  knockoutDevelopmentMatches: number;
  knockoutDevelopmentCorrect: number;
  knockoutHoldoutAccuracy: number | null;
  knockoutHoldoutMatches: number;
  knockoutHoldoutCorrect: number;
  knockoutHoldoutStartDate: string;
  advancementPriorWeight: number;
  advancementFormWeight: number;
  advancementClassifierWeight: number;
  advancementEnvironmentWeight: number;
  scoreModelName: string;
  historicalScoreValidationMae: number;
  historicalExactScoreAccuracy: number;
  knockoutScoreMatches: number;
  knockoutScoreMae: number;
  knockoutExactScoreCorrect: number;
  knockoutExactScoreAccuracy: number;
  scoreDevelopmentExactCorrect: number;
  scoreDevelopmentExactAccuracy: number;
  scoreHoldoutExactCorrect: number;
  scoreHoldoutExactAccuracy: number;
  knockoutIndividualTeamWithinOneCorrect: number;
  knockoutIndividualTeamWithinOneAccuracy: number;
  knockoutBothTeamsWithinOneCorrect: number;
  knockoutBothTeamsWithinOneAccuracy: number;
  scoreHistoryWeight: number;
  scorePaceWeight: number;
  scoreAttackShare: number;
  scoreRecentMatchWeight: number;
  scoreScale: number;
  scoreEnvironmentAdjustment: number;
  scoreGroupCalibrationWeight: number;
  groupScoreCalibrationModelName: string;
  groupScoreCalibrationRows: number;
  groupScoreCalibrationValidationRows: number;
  groupScoreCalibrationAlpha: number;
  groupScoreCalibrationValidationMae: number;
  groupScoreCalibrationValidationPoissonDeviance: number;
  groupScoreCalibrationValidationExactCorrect: number;
  groupScoreCalibrationValidationExactAccuracy: number;
  groupScoreBaselineValidationMae: number;
  groupScoreBaselineValidationPoissonDeviance: number;
  groupScoreBaselineValidationExactCorrect: number;
  groupScoreBaselineValidationExactAccuracy: number;
  notes: string;
}

export type FixtureStatus = "completed" | "scheduled" | "projected";

export interface TournamentFixture {
  id: string;
  matchNumber: number;
  round: string;
  date: string;
  venue: string;
  city: string;
  status: FixtureStatus;
  teamAId?: string;
  teamBId?: string;
  teamALabel?: Record<"zh" | "en", string>;
  teamBLabel?: Record<"zh" | "en", string>;
  teamAScore?: number;
  teamBScore?: number;
  penaltyScore?: string;
  winnerTeamId?: string;
  sourceUrls: string[];
}

export type OverviewSection = "home" | "groups" | "knockout" | "players" | "beginner" | "stories" | "data";

export type OffFieldStoryCategory =
  | "logistics"
  | "team-camp"
  | "climate"
  | "injury"
  | "matchday"
  | "venue"
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
