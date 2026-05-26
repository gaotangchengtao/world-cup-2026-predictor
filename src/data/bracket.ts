import type { BracketMatch, BracketRound, BracketSlot, GroupCode } from "../types/worldCup";

const slot = (
  id: string,
  label: string,
  teamId?: string,
  sourceGroup?: GroupCode,
  sourceGroups?: GroupCode[],
): BracketSlot => ({
  id,
  label,
  teamId,
  sourceGroup,
  sourceGroups,
  seedType: label.startsWith("Winner")
    ? "winner"
    : label.startsWith("Runner-up")
      ? "runner-up"
      : label.startsWith("Best 3rd")
        ? "best-third"
        : label.startsWith("Winner of")
          ? "winner-of"
          : "manual",
});

const match = (
  id: string,
  roundId: string,
  roundName: string,
  matchNumber: number,
  slotA: BracketSlot,
  slotB: BracketSlot,
  nextMatchId?: string,
  nextSlot?: "slotA" | "slotB",
): BracketMatch => ({
  id,
  roundId,
  roundName,
  matchNumber,
  slotA,
  slotB,
  nextMatchId,
  nextSlot,
});

export const defaultBracketRounds: BracketRound[] = [
  {
    id: "round-32",
    name: "Round of 32",
    order: 1,
    matches: [
      match("r32-1", "round-32", "Round of 32", 1, slot("r32-1-a", "Winner Group A", "mexico", "A"), slot("r32-1-b", "Best 3rd Group B/E/F/I", "qatar", undefined, ["B", "E", "F", "I"]), "r16-1", "slotA"),
      match("r32-2", "round-32", "Round of 32", 2, slot("r32-2-a", "Winner Group B", "switzerland", "B"), slot("r32-2-b", "Runner-up Group A", "south-korea", "A"), "r16-1", "slotB"),
      match("r32-3", "round-32", "Round of 32", 3, slot("r32-3-a", "Winner Group C", "brazil", "C"), slot("r32-3-b", "Best 3rd Group D/F/H/J", "australia", undefined, ["D", "F", "H", "J"]), "r16-2", "slotA"),
      match("r32-4", "round-32", "Round of 32", 4, slot("r32-4-a", "Winner Group D", "usa", "D"), slot("r32-4-b", "Runner-up Group C", "morocco", "C"), "r16-2", "slotB"),
      match("r32-5", "round-32", "Round of 32", 5, slot("r32-5-a", "Winner Group E", "germany", "E"), slot("r32-5-b", "Best 3rd Group C/F/G/K", "sweden", undefined, ["C", "F", "G", "K"]), "r16-3", "slotA"),
      match("r32-6", "round-32", "Round of 32", 6, slot("r32-6-a", "Winner Group F", "netherlands", "F"), slot("r32-6-b", "Runner-up Group E", "ecuador", "E"), "r16-3", "slotB"),
      match("r32-7", "round-32", "Round of 32", 7, slot("r32-7-a", "Winner Group G", "belgium", "G"), slot("r32-7-b", "Best 3rd Group A/B/C/H", "czechia", undefined, ["A", "B", "C", "H"]), "r16-4", "slotA"),
      match("r32-8", "round-32", "Round of 32", 8, slot("r32-8-a", "Winner Group H", "spain", "H"), slot("r32-8-b", "Runner-up Group G", "iran", "G"), "r16-4", "slotB"),
      match("r32-9", "round-32", "Round of 32", 9, slot("r32-9-a", "Winner Group I", "france", "I"), slot("r32-9-b", "Best 3rd Group A/D/J/L", "algeria", undefined, ["A", "D", "J", "L"]), "r16-5", "slotA"),
      match("r32-10", "round-32", "Round of 32", 10, slot("r32-10-a", "Winner Group J", "argentina", "J"), slot("r32-10-b", "Runner-up Group I", "senegal", "I"), "r16-5", "slotB"),
      match("r32-11", "round-32", "Round of 32", 11, slot("r32-11-a", "Winner Group K", "portugal", "K"), slot("r32-11-b", "Best 3rd Group E/I/J/L", "ghana", undefined, ["E", "I", "J", "L"]), "r16-6", "slotA"),
      match("r32-12", "round-32", "Round of 32", 12, slot("r32-12-a", "Winner Group L", "england", "L"), slot("r32-12-b", "Runner-up Group K", "colombia", "K"), "r16-6", "slotB"),
      match("r32-13", "round-32", "Round of 32", 13, slot("r32-13-a", "Runner-up Group F", "japan", "F"), slot("r32-13-b", "Runner-up Group J", "austria", "J"), "r16-7", "slotA"),
      match("r32-14", "round-32", "Round of 32", 14, slot("r32-14-a", "Runner-up Group H", "uruguay", "H"), slot("r32-14-b", "Runner-up Group B", "canada", "B"), "r16-7", "slotB"),
      match("r32-15", "round-32", "Round of 32", 15, slot("r32-15-a", "Runner-up Group D", "turkiye", "D"), slot("r32-15-b", "Runner-up Group L", "croatia", "L"), "r16-8", "slotA"),
      match("r32-16", "round-32", "Round of 32", 16, slot("r32-16-a", "Best 3rd Group C/D/I/K", "norway", undefined, ["C", "D", "I", "K"]), slot("r32-16-b", "Best 3rd Group E/F/G/L", "cote-divoire", undefined, ["E", "F", "G", "L"]), "r16-8", "slotB"),
    ],
  },
  {
    id: "round-16",
    name: "Round of 16",
    order: 2,
    matches: [
      match("r16-1", "round-16", "Round of 16", 1, slot("r16-1-a", "Winner of R32 Match 1"), slot("r16-1-b", "Winner of R32 Match 2"), "qf-1", "slotA"),
      match("r16-2", "round-16", "Round of 16", 2, slot("r16-2-a", "Winner of R32 Match 3"), slot("r16-2-b", "Winner of R32 Match 4"), "qf-1", "slotB"),
      match("r16-3", "round-16", "Round of 16", 3, slot("r16-3-a", "Winner of R32 Match 5"), slot("r16-3-b", "Winner of R32 Match 6"), "qf-2", "slotA"),
      match("r16-4", "round-16", "Round of 16", 4, slot("r16-4-a", "Winner of R32 Match 7"), slot("r16-4-b", "Winner of R32 Match 8"), "qf-2", "slotB"),
      match("r16-5", "round-16", "Round of 16", 5, slot("r16-5-a", "Winner of R32 Match 9"), slot("r16-5-b", "Winner of R32 Match 10"), "qf-3", "slotA"),
      match("r16-6", "round-16", "Round of 16", 6, slot("r16-6-a", "Winner of R32 Match 11"), slot("r16-6-b", "Winner of R32 Match 12"), "qf-3", "slotB"),
      match("r16-7", "round-16", "Round of 16", 7, slot("r16-7-a", "Winner of R32 Match 13"), slot("r16-7-b", "Winner of R32 Match 14"), "qf-4", "slotA"),
      match("r16-8", "round-16", "Round of 16", 8, slot("r16-8-a", "Winner of R32 Match 15"), slot("r16-8-b", "Winner of R32 Match 16"), "qf-4", "slotB"),
    ],
  },
  {
    id: "quarter-finals",
    name: "Quarter-finals",
    order: 3,
    matches: [
      match("qf-1", "quarter-finals", "Quarter-finals", 1, slot("qf-1-a", "Winner of R16 Match 1"), slot("qf-1-b", "Winner of R16 Match 2"), "sf-1", "slotA"),
      match("qf-2", "quarter-finals", "Quarter-finals", 2, slot("qf-2-a", "Winner of R16 Match 3"), slot("qf-2-b", "Winner of R16 Match 4"), "sf-1", "slotB"),
      match("qf-3", "quarter-finals", "Quarter-finals", 3, slot("qf-3-a", "Winner of R16 Match 5"), slot("qf-3-b", "Winner of R16 Match 6"), "sf-2", "slotA"),
      match("qf-4", "quarter-finals", "Quarter-finals", 4, slot("qf-4-a", "Winner of R16 Match 7"), slot("qf-4-b", "Winner of R16 Match 8"), "sf-2", "slotB"),
    ],
  },
  {
    id: "semi-finals",
    name: "Semi-finals",
    order: 4,
    matches: [
      match("sf-1", "semi-finals", "Semi-finals", 1, slot("sf-1-a", "Winner of Quarter-final 1"), slot("sf-1-b", "Winner of Quarter-final 2"), "final-1", "slotA"),
      match("sf-2", "semi-finals", "Semi-finals", 2, slot("sf-2-a", "Winner of Quarter-final 3"), slot("sf-2-b", "Winner of Quarter-final 4"), "final-1", "slotB"),
    ],
  },
  {
    id: "final",
    name: "Final",
    order: 5,
    matches: [
      match("final-1", "final", "Final", 1, slot("final-1-a", "Winner of Semi-final 1"), slot("final-1-b", "Winner of Semi-final 2")),
    ],
  },
];
