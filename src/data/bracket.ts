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
  actualWinnerTeamId?: string,
): BracketMatch => ({
  id,
  roundId,
  roundName,
  matchNumber,
  slotA,
  slotB,
  nextMatchId,
  nextSlot,
  actualWinnerTeamId,
});

export const defaultBracketRounds: BracketRound[] = [
  {
    id: "round-32",
    name: "Round of 32",
    order: 1,
    matches: [
      match("r32-1", "round-32", "Round of 32", 73, slot("r32-1-a", "Runner-up Group A", "south-africa", "A"), slot("r32-1-b", "Runner-up Group B", "canada", "B"), "r16-1", "slotA", "canada"),
      match("r32-2", "round-32", "Round of 32", 74, slot("r32-2-a", "Winner Group E", "germany", "E"), slot("r32-2-b", "Best 3rd Group D", "paraguay", "D", ["A", "B", "C", "D", "F"]), "r16-2", "slotA", "paraguay"),
      match("r32-3", "round-32", "Round of 32", 75, slot("r32-3-a", "Winner Group F", "netherlands", "F"), slot("r32-3-b", "Runner-up Group C", "morocco", "C"), "r16-1", "slotB", "morocco"),
      match("r32-4", "round-32", "Round of 32", 76, slot("r32-4-a", "Winner Group C", "brazil", "C"), slot("r32-4-b", "Runner-up Group F", "japan", "F"), "r16-3", "slotA", "brazil"),
      match("r32-5", "round-32", "Round of 32", 77, slot("r32-5-a", "Winner Group I", "france", "I"), slot("r32-5-b", "Best 3rd Group F", "sweden", "F", ["C", "D", "F", "G", "H"]), "r16-2", "slotB", "france"),
      match("r32-6", "round-32", "Round of 32", 78, slot("r32-6-a", "Runner-up Group E", "cote-divoire", "E"), slot("r32-6-b", "Runner-up Group I", "norway", "I"), "r16-3", "slotB", "norway"),
      match("r32-7", "round-32", "Round of 32", 79, slot("r32-7-a", "Winner Group A", "mexico", "A"), slot("r32-7-b", "Best 3rd Group E", "ecuador", "E", ["C", "E", "F", "H", "I"]), "r16-4", "slotA", "mexico"),
      match("r32-8", "round-32", "Round of 32", 80, slot("r32-8-a", "Winner Group L", "england", "L"), slot("r32-8-b", "Best 3rd Group K", "dr-congo", "K", ["E", "H", "I", "J", "K"]), "r16-4", "slotB", "england"),
      match("r32-9", "round-32", "Round of 32", 81, slot("r32-9-a", "Winner Group D", "usa", "D"), slot("r32-9-b", "Best 3rd Group B", "bosnia-herzegovina", "B", ["B", "E", "F", "I", "J"]), "r16-6", "slotA", "usa"),
      match("r32-10", "round-32", "Round of 32", 82, slot("r32-10-a", "Winner Group G", "belgium", "G"), slot("r32-10-b", "Best 3rd Group I", "senegal", "I", ["A", "E", "H", "I", "J"]), "r16-6", "slotB", "belgium"),
      match("r32-11", "round-32", "Round of 32", 83, slot("r32-11-a", "Runner-up Group K", "portugal", "K"), slot("r32-11-b", "Runner-up Group L", "croatia", "L"), "r16-5", "slotA", "portugal"),
      match("r32-12", "round-32", "Round of 32", 84, slot("r32-12-a", "Winner Group H", "spain", "H"), slot("r32-12-b", "Runner-up Group J", "austria", "J"), "r16-5", "slotB", "spain"),
      match("r32-13", "round-32", "Round of 32", 85, slot("r32-13-a", "Winner Group B", "switzerland", "B"), slot("r32-13-b", "Best 3rd Group J", "algeria", "J", ["E", "F", "G", "I", "J"]), "r16-8", "slotA", "switzerland"),
      match("r32-14", "round-32", "Round of 32", 86, slot("r32-14-a", "Winner Group J", "argentina", "J"), slot("r32-14-b", "Runner-up Group H", "cape-verde", "H"), "r16-7", "slotA", "argentina"),
      match("r32-15", "round-32", "Round of 32", 87, slot("r32-15-a", "Winner Group K", "colombia", "K"), slot("r32-15-b", "Best 3rd Group L", "ghana", "L", ["D", "E", "I", "J", "L"]), "r16-8", "slotB", "colombia"),
      match("r32-16", "round-32", "Round of 32", 88, slot("r32-16-a", "Runner-up Group D", "australia", "D"), slot("r32-16-b", "Runner-up Group G", "egypt", "G"), "r16-7", "slotB", "egypt"),
    ],
  },
  {
    id: "round-16",
    name: "Round of 16",
    order: 2,
    matches: [
      match("r16-1", "round-16", "Round of 16", 89, slot("r16-1-a", "Winner of Match 73"), slot("r16-1-b", "Winner of Match 75"), "qf-1", "slotA", "morocco"),
      match("r16-2", "round-16", "Round of 16", 90, slot("r16-2-a", "Winner of Match 74"), slot("r16-2-b", "Winner of Match 77"), "qf-1", "slotB", "france"),
      match("r16-3", "round-16", "Round of 16", 91, slot("r16-3-a", "Winner of Match 76"), slot("r16-3-b", "Winner of Match 78"), "qf-3", "slotA", "norway"),
      match("r16-4", "round-16", "Round of 16", 92, slot("r16-4-a", "Winner of Match 79"), slot("r16-4-b", "Winner of Match 80"), "qf-3", "slotB", "england"),
      match("r16-5", "round-16", "Round of 16", 93, slot("r16-5-a", "Winner of Match 83"), slot("r16-5-b", "Winner of Match 84"), "qf-2", "slotA", "spain"),
      match("r16-6", "round-16", "Round of 16", 94, slot("r16-6-a", "Winner of Match 81"), slot("r16-6-b", "Winner of Match 82"), "qf-2", "slotB", "belgium"),
      match("r16-7", "round-16", "Round of 16", 95, slot("r16-7-a", "Winner of Match 86"), slot("r16-7-b", "Winner of Match 88"), "qf-4", "slotA", "argentina"),
      match("r16-8", "round-16", "Round of 16", 96, slot("r16-8-a", "Winner of Match 85"), slot("r16-8-b", "Winner of Match 87"), "qf-4", "slotB", "switzerland"),
    ],
  },
  {
    id: "quarter-finals",
    name: "Quarter-finals",
    order: 3,
    matches: [
      match("qf-1", "quarter-finals", "Quarter-finals", 97, slot("qf-1-a", "Winner of Match 89"), slot("qf-1-b", "Winner of Match 90"), "sf-1", "slotA"),
      match("qf-2", "quarter-finals", "Quarter-finals", 98, slot("qf-2-a", "Winner of Match 93"), slot("qf-2-b", "Winner of Match 94"), "sf-1", "slotB"),
      match("qf-3", "quarter-finals", "Quarter-finals", 99, slot("qf-3-a", "Winner of Match 91"), slot("qf-3-b", "Winner of Match 92"), "sf-2", "slotA"),
      match("qf-4", "quarter-finals", "Quarter-finals", 100, slot("qf-4-a", "Winner of Match 95"), slot("qf-4-b", "Winner of Match 96"), "sf-2", "slotB"),
    ],
  },
  {
    id: "semi-finals",
    name: "Semi-finals",
    order: 4,
    matches: [
      match("sf-1", "semi-finals", "Semi-finals", 101, slot("sf-1-a", "Winner of Match 97"), slot("sf-1-b", "Winner of Match 98"), "final-1", "slotA"),
      match("sf-2", "semi-finals", "Semi-finals", 102, slot("sf-2-a", "Winner of Match 99"), slot("sf-2-b", "Winner of Match 100"), "final-1", "slotB"),
    ],
  },
  {
    id: "final",
    name: "Final",
    order: 5,
    matches: [
      match("final-1", "final", "Final", 104, slot("final-1-a", "Winner of Match 101"), slot("final-1-b", "Winner of Match 102")),
    ],
  },
];
