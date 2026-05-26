import { defaultBracketRounds } from "../data/bracket";
import type { BracketMatch, BracketPredictionState } from "../types/worldCup";

export const flattenMatches = () => defaultBracketRounds.flatMap((round) => round.matches);

export const createInitialBracketState = (): BracketPredictionState => {
  const state: BracketPredictionState = {};

  flattenMatches().forEach((match) => {
    state[match.id] = {
      slotA: match.slotA.teamId,
      slotB: match.slotB.teamId,
      winnerTeamId: undefined,
    };
  });

  return state;
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

  return match ? clearDownstream(updated, match) : updated;
};

export const chooseWinner = (
  state: BracketPredictionState,
  matchId: string,
  winnerTeamId: string,
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

    return nextMatch ? clearDownstream(updated, nextMatch) : updated;
  }

  return updated;
};

export const getChampionId = (state: BracketPredictionState) => state["final-1"]?.winnerTeamId;
