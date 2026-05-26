import type {
  GroupMatch,
  GroupMatchScore,
  GroupStagePredictionState,
  GroupStandingRow,
  Team,
  WorldCupGroup,
} from "../types/worldCup";

const pairings = [
  [0, 1],
  [2, 3],
  [0, 2],
  [1, 3],
  [0, 3],
  [1, 2],
] as const;

export const createGroupMatches = (groups: WorldCupGroup[]): GroupMatch[] =>
  groups.flatMap((group) =>
    pairings.map(([homeIndex, awayIndex], index) => ({
      id: `${group.code}-${index + 1}`,
      group: group.code,
      matchday: Math.floor(index / 2) + 1,
      homeTeamId: group.teamIds[homeIndex],
      awayTeamId: group.teamIds[awayIndex],
    })),
  );

export const isCompleteScore = (score?: GroupMatchScore) =>
  typeof score?.homeScore === "number" && typeof score.awayScore === "number";

const emptyRow = (teamId: string): GroupStandingRow => ({
  teamId,
  played: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDifference: 0,
  points: 0,
  position: 4,
});

export const qualificationKey = (position: GroupStandingRow["position"]) => {
  if (position === 1) return "groupFirst";
  if (position === 2) return "groupSecond";
  if (position === 3) return "groupThird";
  return "groupEliminated";
};

export const calculateGroupStandings = (
  group: WorldCupGroup,
  teams: Team[],
  matches: GroupMatch[],
  predictions: GroupStagePredictionState,
) => {
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const rows = new Map(group.teamIds.map((teamId) => [teamId, emptyRow(teamId)]));

  matches
    .filter((match) => match.group === group.code)
    .forEach((match) => {
      const score = predictions[match.id];
      if (!isCompleteScore(score)) return;

      const home = rows.get(match.homeTeamId);
      const away = rows.get(match.awayTeamId);
      if (!home || !away) return;

      const homeScore = score.homeScore ?? 0;
      const awayScore = score.awayScore ?? 0;
      home.played += 1;
      away.played += 1;
      home.goalsFor += homeScore;
      home.goalsAgainst += awayScore;
      away.goalsFor += awayScore;
      away.goalsAgainst += homeScore;

      if (homeScore > awayScore) {
        home.wins += 1;
        away.losses += 1;
        home.points += 3;
      } else if (homeScore < awayScore) {
        away.wins += 1;
        home.losses += 1;
        away.points += 3;
      } else {
        home.draws += 1;
        away.draws += 1;
        home.points += 1;
        away.points += 1;
      }
    });

  return Array.from(rows.values())
    .map((row) => ({
      ...row,
      goalDifference: row.goalsFor - row.goalsAgainst,
    }))
    .sort((a, b) => {
      const teamA = teamById.get(a.teamId);
      const teamB = teamById.get(b.teamId);

      return (
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        (teamA?.strengthRank ?? 999) - (teamB?.strengthRank ?? 999)
      );
    })
    .map((row, index) => ({
      ...row,
      position: (index + 1) as GroupStandingRow["position"],
    }));
};
