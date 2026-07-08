import { defaultBracketRounds } from "../data/bracket";
import { teams as defaultTeams } from "../data/teams";
import type { BracketMatch, BracketPredictionState, Team } from "../types/worldCup";

export const flattenMatches = () => defaultBracketRounds.flatMap((round) => round.matches);

export type WinnerPicker = (
  slotA: string | undefined,
  slotB: string | undefined,
  teams: Team[],
) => string | undefined;

const pickPredictedWinner: WinnerPicker = (slotA, slotB, teams) => {
  if (!slotA) return slotB;
  if (!slotB) return slotA;

  const teamA = teams.find((team) => team.id === slotA);
  const teamB = teams.find((team) => team.id === slotB);
  const rankA = teamA?.strengthRank ?? 999;
  const rankB = teamB?.strengthRank ?? 999;
  const scoreA = teamA?.strengthScore ?? 0;
  const scoreB = teamB?.strengthScore ?? 0;

  if (rankA !== rankB) return rankA < rankB ? slotA : slotB;
  return scoreA >= scoreB ? slotA : slotB;
};

const isWinnerInMatch = (winnerTeamId: string | undefined, slotA?: string, slotB?: string) =>
  Boolean(winnerTeamId && (winnerTeamId === slotA || winnerTeamId === slotB));

export const completeBracketState = (
  state: BracketPredictionState,
  teams: Team[] = defaultTeams,
  pickWinner: WinnerPicker = pickPredictedWinner,
): BracketPredictionState => {
  const completed: BracketPredictionState = {};
  const matches = flattenMatches();

  matches.forEach((match) => {
    const current = state[match.id] ?? {};
    completed[match.id] = {
      slotA: current.slotA ?? match.slotA.teamId,
      slotB: current.slotB ?? match.slotB.teamId,
      winnerTeamId: current.winnerTeamId,
    };
  });

  matches.forEach((match) => {
    const current = completed[match.id] ?? {};
    const winnerTeamId = isWinnerInMatch(current.winnerTeamId, current.slotA, current.slotB)
      ? current.winnerTeamId
      : isWinnerInMatch(match.actualWinnerTeamId, current.slotA, current.slotB)
        ? match.actualWinnerTeamId
      : pickWinner(current.slotA, current.slotB, teams);

    completed[match.id] = {
      ...current,
      winnerTeamId,
    };

    if (winnerTeamId && match.nextMatchId && match.nextSlot) {
      completed[match.nextMatchId] = {
        ...completed[match.nextMatchId],
        [match.nextSlot]: completed[match.nextMatchId]?.[match.nextSlot] ?? winnerTeamId,
      };
    }
  });

  return completed;
};

export const createInitialBracketState = (teams: Team[] = defaultTeams): BracketPredictionState => {
  const state: BracketPredictionState = {};

  flattenMatches().forEach((match) => {
    state[match.id] = {
      slotA: match.slotA.teamId,
      slotB: match.slotB.teamId,
      winnerTeamId: undefined,
    };
  });

  return completeBracketState(state, teams);
};

export const createRecommendedBracketState = (
  teams: Team[] = defaultTeams,
  pickWinner: WinnerPicker = pickPredictedWinner,
): BracketPredictionState => {
  const state: BracketPredictionState = {};

  flattenMatches().forEach((match) => {
    state[match.id] = {
      slotA: match.slotA.teamId,
      slotB: match.slotB.teamId,
      winnerTeamId: undefined,
    };
  });

  return completeBracketState(state, teams, pickWinner);
};

export const findMatch = (matchId: string) =>
  flattenMatches().find((match) => match.id === matchId);

const clearDownstream = (
  state: BracketPredictionState,
  match: BracketMatch,
): BracketPredictionState => {
  if (!match.nextMatchId || !match.nextSlot) return state;

  const nextMatch = findMatch(match.nextMatchId);
  if (!nextMatch) return state;

  const nextState = {
    ...state,
    [nextMatch.id]: {
      ...state[nextMatch.id],
      [match.nextSlot]: undefined,
      winnerTeamId: undefined,
    },
  };

  return clearDownstream(nextState, nextMatch);
};

export const updateSlot = (
  state: BracketPredictionState,
  matchId: string,
  slotKey: "slotA" | "slotB",
  teamId: string,
  teams: Team[] = defaultTeams,
  pickWinner: WinnerPicker = pickPredictedWinner,
) => {
  const match = findMatch(matchId);
  const updated = {
    ...state,
    [matchId]: {
      ...state[matchId],
      [slotKey]: teamId || undefined,
      winnerTeamId: state[matchId]?.winnerTeamId === teamId ? undefined : state[matchId]?.winnerTeamId,
    },
  };

  return completeBracketState(match ? clearDownstream(updated, match) : updated, teams, pickWinner);
};

export const chooseWinner = (
  state: BracketPredictionState,
  matchId: string,
  winnerTeamId: string,
  teams: Team[] = defaultTeams,
  pickWinner: WinnerPicker = pickPredictedWinner,
): BracketPredictionState => {
  const match = findMatch(matchId);
  if (!match || !winnerTeamId) return state;

  const updated: BracketPredictionState = {
    ...state,
    [matchId]: {
      ...state[matchId],
      winnerTeamId,
    },
  };

  if (match.nextMatchId && match.nextSlot) {
    const nextMatch = findMatch(match.nextMatchId);
    updated[match.nextMatchId] = {
      ...updated[match.nextMatchId],
      [match.nextSlot]: winnerTeamId,
      winnerTeamId: undefined,
    };

    return completeBracketState(nextMatch ? clearDownstream(updated, nextMatch) : updated, teams, pickWinner);
  }

  return completeBracketState(updated, teams, pickWinner);
};

export const getChampionId = (state: BracketPredictionState) => state["final-1"]?.winnerTeamId;

export const findFeederMatch = (matchId: string, slotKey: "slotA" | "slotB") =>
  flattenMatches().find((match) => match.nextMatchId === matchId && match.nextSlot === slotKey);

const usedRoundOf32TeamIds = (
  state: BracketPredictionState,
  currentMatchId: string,
  currentSlotKey: "slotA" | "slotB",
) =>
  new Set(
    defaultBracketRounds[0].matches.flatMap((match) => {
      const matchState = state[match.id];
      return (["slotA", "slotB"] as const)
        .filter((slotKey) => match.id !== currentMatchId || slotKey !== currentSlotKey)
        .map((slotKey) => matchState?.[slotKey])
        .filter((teamId): teamId is string => Boolean(teamId));
    }),
  );

export const getLegalSlotCandidates = (
  state: BracketPredictionState,
  matchId: string,
  slotKey: "slotA" | "slotB",
  teams: Team[] = defaultTeams,
) => {
  const match = findMatch(matchId);
  if (!match) return [];

  const feederMatch = findFeederMatch(matchId, slotKey);
  if (feederMatch) {
    const feederState = state[feederMatch.id];
    const candidateIds = [feederState?.slotA, feederState?.slotB].filter(
      (teamId): teamId is string => Boolean(teamId),
    );
    return candidateIds
      .map((teamId) => teams.find((team) => team.id === teamId))
      .filter((team): team is Team => Boolean(team));
  }

  if (match.roundId !== "round-32") return [];

  const bracketSlot = match[slotKey];
  const legalGroups = bracketSlot.sourceGroup
    ? [bracketSlot.sourceGroup]
    : bracketSlot.sourceGroups ?? [];
  const usedTeamIds = usedRoundOf32TeamIds(state, matchId, slotKey);

  return teams
    .filter((team) => legalGroups.includes(team.group))
    .filter((team) => !usedTeamIds.has(team.id))
    .sort(
      (teamA, teamB) =>
        teamA.predictedGroupPosition - teamB.predictedGroupPosition ||
        teamA.strengthRank - teamB.strengthRank,
    );
};

export const selectLegalSlotTeam = (
  state: BracketPredictionState,
  matchId: string,
  slotKey: "slotA" | "slotB",
  teamId: string,
  teams: Team[] = defaultTeams,
  pickWinner: WinnerPicker = pickPredictedWinner,
) => {
  const isLegal = getLegalSlotCandidates(state, matchId, slotKey, teams).some(
    (team) => team.id === teamId,
  );
  if (!isLegal) return state;

  const feederMatch = findFeederMatch(matchId, slotKey);
  if (feederMatch) {
    return chooseWinner(state, feederMatch.id, teamId, teams, pickWinner);
  }

  return updateSlot(state, matchId, slotKey, teamId, teams, pickWinner);
};
