import { modelPredictionProfiles, predictionModelMeta } from "../data/modelPredictions";
import type {
  BracketPredictionState,
  MatchupPrediction,
  ModelPredictionProfile,
  Player,
  PredictionRisk,
  Team,
} from "../types/worldCup";
import { flattenMatches } from "./bracket";

export { predictionModelMeta };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const sigmoid = (value: number) => 1 / (1 + Math.exp(-value));
const profileByTeamId = new Map(modelPredictionProfiles.map((profile) => [profile.teamId, profile]));

const riskWeight: Record<PredictionRisk, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

const riskFromProbabilityGap = (gap: number): PredictionRisk => {
  if (gap >= 0.28) return "low";
  if (gap >= 0.14) return "medium";
  return "high";
};

export const getModelProfile = (team: Team, players: Player[]): ModelPredictionProfile => {
  const explicit = profileByTeamId.get(team.id);
  if (explicit) return explicit;

  const teamPlayers = players.filter((player) => player.teamId === team.id);
  const keyPlayers = teamPlayers.filter((player) => player.isKeyPlayer).length;
  const squadValue = team.squadValueEurM ?? teamPlayers.reduce((sum, player) => sum + player.marketValueEurM, 0);
  const valueScore = clamp(Math.round((Math.log10(Math.max(1, squadValue)) / Math.log10(1300)) * 100), 28, 94);
  const rankScore = clamp(102 - team.strengthRank * 1.35, 28, 98);
  const keyPlayerScore = clamp(48 + keyPlayers * 7, 42, 92);
  const mlStrengthScore = clamp(Math.round(team.strengthScore * 0.5 + rankScore * 0.24 + valueScore * 0.18 + keyPlayerScore * 0.08), 35, 96);
  const confidenceScore = clamp(Math.round(mlStrengthScore * 0.74 + keyPlayerScore * 0.16 + rankScore * 0.1), 35, 94);

  return {
    teamId: team.id,
    mlStrengthScore,
    recentFormScore: clamp(Math.round(team.strengthScore * 0.72 + rankScore * 0.2), 32, 94),
    attackTrend: clamp(Math.round(valueScore * 0.48 + keyPlayerScore * 0.32 + team.strengthScore * 0.2), 30, 96),
    defenseTrend: clamp(Math.round(team.strengthScore * 0.56 + rankScore * 0.32), 30, 96),
    confidenceScore,
    upsetRisk: team.strengthRank <= 8 && confidenceScore >= 76 ? "low" : team.strengthRank <= 20 ? "medium" : "high",
    explanation: "Fallback profile generated from the current project team and squad fields.",
  };
};

export const getMatchupPrediction = (
  teamA: Team | undefined,
  teamB: Team | undefined,
  players: Player[],
): MatchupPrediction | null => {
  if (!teamA || !teamB) return null;

  const profileA = getModelProfile(teamA, players);
  const profileB = getModelProfile(teamB, players);
  const scoreEdge = profileA.mlStrengthScore - profileB.mlStrengthScore;
  const tournamentFormEdge =
    (profileA.tournamentFormScore ?? profileA.recentFormScore)
    - (profileB.tournamentFormScore ?? profileB.recentFormScore);
  const attackDefenseEdge =
    (profileA.attackTrend - profileB.defenseTrend + profileA.defenseTrend - profileB.attackTrend) / 2;
  const availabilityEdge =
    (profileA.squadAvailabilityScore ?? 85) - (profileB.squadAvailabilityScore ?? 85);
  const tacticalEdge = (profileA.tacticalFitScore ?? 80) - (profileB.tacticalFitScore ?? 80);
  const playerFitEdge = (profileA.playerFitScore ?? 80) - (profileB.playerFitScore ?? 80);
  const cohesionEdge = (profileA.squadCohesionScore ?? 80) - (profileB.squadCohesionScore ?? 80);
  const coachEdge = (profileA.coachAdaptabilityScore ?? 80) - (profileB.coachAdaptabilityScore ?? 80);
  const edge =
    scoreEdge * 0.36
    + tournamentFormEdge * 0.22
    + attackDefenseEdge * 0.1
    + availabilityEdge * 0.08
    + tacticalEdge * 0.08
    + playerFitEdge * 0.08
    + cohesionEdge * 0.05
    + coachEdge * 0.03;
  const drawProbability = clamp(0.24 - Math.abs(edge) * 0.0025, 0.12, 0.28);
  const teamAWinProbability = clamp((1 - drawProbability) * sigmoid(edge / 8.5), 0.04, 0.9);
  const teamBWinProbability = clamp(1 - drawProbability - teamAWinProbability, 0.04, 0.9);
  const extraTimeContext =
    ((profileA.squadCohesionScore ?? 80) - (profileB.squadCohesionScore ?? 80)) * 0.001
    + ((profileA.coachAdaptabilityScore ?? 80) - (profileB.coachAdaptabilityScore ?? 80)) * 0.001;
  const teamAAdvanceProbability = clamp(
    teamAWinProbability + drawProbability * 0.5 + extraTimeContext,
    0.05,
    0.95,
  );
  const teamBAdvanceProbability = clamp(1 - teamAAdvanceProbability, 0.05, 0.95);
  const gap = Math.abs(teamAAdvanceProbability - teamBAdvanceProbability);
  const confidenceScore = clamp(
    Math.round(50 + gap * 100 * 0.62 + Math.max(profileA.confidenceScore, profileB.confidenceScore) * 0.18),
    38,
    96,
  );
  const factors = [
    { key: "currentTournamentForm", value: Math.abs(tournamentFormEdge * 0.22) },
    { key: "mlStrength", value: Math.abs(scoreEdge * 0.36) },
    { key: "attackDefense", value: Math.abs(attackDefenseEdge * 0.1) },
    { key: "squadAvailability", value: Math.abs(availabilityEdge * 0.08) },
    { key: "tacticalFit", value: Math.abs(tacticalEdge * 0.08) },
    { key: "playerFit", value: Math.abs(playerFitEdge * 0.08) },
    { key: "squadCohesion", value: Math.abs(cohesionEdge * 0.05) },
    { key: "coachAdaptability", value: Math.abs(coachEdge * 0.03) },
  ]
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((factor) => factor.key);

  return {
    teamAId: teamA.id,
    teamBId: teamB.id,
    teamAWinProbability,
    drawProbability,
    teamBWinProbability,
    teamAAdvanceProbability,
    teamBAdvanceProbability,
    topFactors: factors,
    confidenceScore,
    upsetRisk: riskFromProbabilityGap(gap),
  };
};

export const getRecommendedWinnerId = (teamA: Team | undefined, teamB: Team | undefined, players: Player[]) => {
  if (!teamA) return teamB?.id;
  if (!teamB) return teamA.id;
  const prediction = getMatchupPrediction(teamA, teamB, players);
  if (!prediction) return teamA.strengthRank <= teamB.strengthRank ? teamA.id : teamB.id;

  const probabilityGap = Math.abs(prediction.teamAAdvanceProbability - prediction.teamBAdvanceProbability);
  if (probabilityGap < 0.08) {
    const profileA = getModelProfile(teamA, players);
    const profileB = getModelProfile(teamB, players);
    if (profileA.mlStrengthScore !== profileB.mlStrengthScore) {
      return profileA.mlStrengthScore > profileB.mlStrengthScore ? teamA.id : teamB.id;
    }
    return profileA.confidenceScore >= profileB.confidenceScore ? teamA.id : teamB.id;
  }

  return prediction.teamAAdvanceProbability >= prediction.teamBAdvanceProbability ? teamA.id : teamB.id;
};

export const getModelChampionContenders = (teams: Team[], players: Player[], limit = 5) =>
  [...teams]
    .map((team) => ({ team, profile: getModelProfile(team, players) }))
    .sort((a, b) => {
      if (b.profile.mlStrengthScore !== a.profile.mlStrengthScore) return b.profile.mlStrengthScore - a.profile.mlStrengthScore;
      return b.profile.confidenceScore - a.profile.confidenceScore;
    })
    .slice(0, limit);

export const getModelConfidenceLeaders = (teams: Team[], players: Player[], limit = 5) =>
  [...teams]
    .map((team) => ({ team, profile: getModelProfile(team, players) }))
    .sort((a, b) => b.profile.confidenceScore - a.profile.confidenceScore)
    .slice(0, limit);

export const getUpsetWatchMatchups = (
  teams: Team[],
  players: Player[],
  bracketState: BracketPredictionState,
  limit = 5,
) =>
  flattenMatches()
    .map((match) => {
      const state = bracketState[match.id];
      const teamA = teams.find((team) => team.id === state?.slotA);
      const teamB = teams.find((team) => team.id === state?.slotB);
      const prediction = getMatchupPrediction(teamA, teamB, players);
      if (!teamA || !teamB || !prediction) return null;
      const teamAFavored = prediction.teamAAdvanceProbability >= prediction.teamBAdvanceProbability;
      const favorite = teamAFavored ? teamA : teamB;
      const underdog = teamAFavored ? teamB : teamA;
      const underdogProbability = teamAFavored ? prediction.teamBAdvanceProbability : prediction.teamAAdvanceProbability;
      const favoriteProfile = getModelProfile(favorite, players);
      const riskScore =
        underdogProbability * 100 +
        riskWeight[prediction.upsetRisk] * 12 +
        (favorite.strengthRank <= 10 ? 8 : 0) -
        (favoriteProfile.upsetRisk === "low" ? 4 : 0);

      return { match, favorite, underdog, prediction, riskScore, underdogProbability };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, limit);
