import {
  modelPredictionProfiles,
  modelScheduledMatchPredictions,
  predictionModelMeta,
} from "../data/modelPredictions";
import type {
  BracketPredictionState,
  MatchScorePrediction,
  MatchupPrediction,
  ModelPredictionProfile,
  Player,
  PredictionRisk,
  Team,
} from "../types/worldCup";
import { flattenMatches } from "./bracket";

export { predictionModelMeta };

// 本文件负责“网页端推理”：读取 Python 已生成的球队画像，再计算具体对阵和整条淘汰赛路径。
// 它不会在浏览器里重新训练模型，因此 GitHub Pages 仍然是纯静态网站。
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
// sigmoid 把可以为任意大小的综合优势值压缩到 0-1 概率区间。
const sigmoid = (value: number) => 1 / (1 + Math.exp(-value));

const factorial = (value: number) => {
  let result = 1;
  for (let index = 2; index <= value; index += 1) result *= index;
  return result;
};

const poissonProbability = (expectedGoals: number, goals: number) => {
  const safeExpectedGoals = Math.max(0.01, expectedGoals);
  return (Math.exp(-safeExpectedGoals) * safeExpectedGoals ** goals) / factorial(goals);
};

type OutcomeLabel = 0 | 1 | 2;

const mostLikelyScoreline = (
  expectedTeamAGoals: number,
  expectedTeamBGoals: number,
  outcomeLabel?: OutcomeLabel,
  maxGoals = 7,
) => {
  let best = { teamAScore: 0, teamBScore: 0, probability: -1 };
  for (let teamAScore = 0; teamAScore <= maxGoals; teamAScore += 1) {
    for (let teamBScore = 0; teamBScore <= maxGoals; teamBScore += 1) {
      const label: OutcomeLabel = teamAScore > teamBScore ? 0 : teamAScore === teamBScore ? 1 : 2;
      if (outcomeLabel !== undefined && label !== outcomeLabel) continue;
      const probability =
        poissonProbability(expectedTeamAGoals, teamAScore)
        * poissonProbability(expectedTeamBGoals, teamBScore);
      if (probability > best.probability) best = { teamAScore, teamBScore, probability };
    }
  }
  return best;
};

const buildScorePrediction = (
  expectedTeamAGoals90: number,
  expectedTeamBGoals90: number,
  regulationOutcome: OutcomeLabel,
  teamAEnvironmentReadiness = 65,
  teamBEnvironmentReadiness = 65,
): MatchScorePrediction => {
  const expectedA = clamp(expectedTeamAGoals90, 0.15, 4.5);
  const expectedB = clamp(expectedTeamBGoals90, 0.15, 4.5);
  const regulation = mostLikelyScoreline(expectedA, expectedB, regulationOutcome);
  const extraTimePlayed = regulation.teamAScore === regulation.teamBScore;
  let extraTimeTeamAScore = 0;
  let extraTimeTeamBScore = 0;

  if (extraTimePlayed) {
    const teamAFactor = clamp(0.78 + teamAEnvironmentReadiness / 350, 0.84, 1.05);
    const teamBFactor = clamp(0.78 + teamBEnvironmentReadiness / 350, 0.84, 1.05);
    const extraTime = mostLikelyScoreline(
      (expectedA / 3) * 0.78 * teamAFactor,
      (expectedB / 3) * 0.78 * teamBFactor,
      undefined,
      3,
    );
    extraTimeTeamAScore = extraTime.teamAScore;
    extraTimeTeamBScore = extraTime.teamBScore;
  }

  const finalTeamAScore = regulation.teamAScore + extraTimeTeamAScore;
  const finalTeamBScore = regulation.teamBScore + extraTimeTeamBScore;
  return {
    expectedTeamAGoals90: Math.round(expectedA * 100) / 100,
    expectedTeamBGoals90: Math.round(expectedB * 100) / 100,
    regulationTeamAScore: regulation.teamAScore,
    regulationTeamBScore: regulation.teamBScore,
    extraTimeTeamAScore,
    extraTimeTeamBScore,
    finalTeamAScore,
    finalTeamBScore,
    extraTimePlayed,
    decidedBy: !extraTimePlayed
      ? "regulation"
      : finalTeamAScore === finalTeamBScore
        ? "penalties"
        : "extra-time",
  };
};

const reverseScorePrediction = (score: MatchScorePrediction): MatchScorePrediction => ({
  expectedTeamAGoals90: score.expectedTeamBGoals90,
  expectedTeamBGoals90: score.expectedTeamAGoals90,
  regulationTeamAScore: score.regulationTeamBScore,
  regulationTeamBScore: score.regulationTeamAScore,
  extraTimeTeamAScore: score.extraTimeTeamBScore,
  extraTimeTeamBScore: score.extraTimeTeamAScore,
  finalTeamAScore: score.finalTeamBScore,
  finalTeamBScore: score.finalTeamAScore,
  extraTimePlayed: score.extraTimePlayed,
  decidedBy: score.decidedBy,
});
// 使用 Map 可以按 teamId 快速取得离线训练生成的球队画像。
const profileByTeamId = new Map(modelPredictionProfiles.map((profile) => [profile.teamId, profile]));
const scheduledPredictionByMatchNumber = new Map(
  modelScheduledMatchPredictions.map((prediction) => [prediction.matchNumber, prediction]),
);

export const getScheduledMatchPrediction = (matchNumber: number) =>
  scheduledPredictionByMatchNumber.get(matchNumber);

const riskWeight: Record<PredictionRisk, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

const riskFromProbabilityGap = (gap: number): PredictionRisk => {
  // 两队晋级概率越接近，比赛越容易出现与推荐结果相反的情况。
  if (gap >= 0.28) return "low";
  if (gap >= 0.14) return "medium";
  return "high";
};

/**
 * 取得球队预测画像。
 * 正常情况下直接使用 Python 输出；如果某支新球队暂时没有训练结果，则用项目基础字段生成保底画像。
 */
export const getModelProfile = (team: Team, players: Player[]): ModelPredictionProfile => {
  const explicit = profileByTeamId.get(team.id);
  if (explicit) return explicit;

  const teamPlayers = players.filter((player) => player.teamId === team.id);
  const keyPlayers = teamPlayers.filter((player) => player.isKeyPlayer).length;
  const squadValue = team.squadValueEurM ?? teamPlayers.reduce((sum, player) => sum + player.marketValueEurM, 0);
  const valueScore = clamp(Math.round((Math.log10(Math.max(1, squadValue)) / Math.log10(1300)) * 100), 28, 94);
  const rankScore = clamp(102 - team.strengthRank * 1.35, 28, 98);
  const keyPlayerScore = clamp(48 + keyPlayers * 7, 42, 92);
  // 保底综合分：基础实力 50% + 排名换算 24% + 身价 18% + 核心球员 8%。
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

/**
 * 计算两支球队在具体对阵中的常规时间胜/平/负概率，以及淘汰赛晋级概率。
 * 注意：这里使用的是两队各项评分之“差”，不是把球队总排名直接当成胜率。
 */
export const getMatchupPrediction = (
  teamA: Team | undefined,
  teamB: Team | undefined,
  players: Player[],
  matchNumber?: number,
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
  // 综合优势 Edge 的权重合计为 100%。修改这些数字时应继续保持总和为 1。
  // 实力 36%、本届状态 22%、攻防对位 10%、可用性/战术/角色适配各 8%、默契 5%、教练 3%。
  const edge =
    scoreEdge * 0.36
    + tournamentFormEdge * 0.22
    + attackDefenseEdge * 0.1
    + availabilityEdge * 0.08
    + tacticalEdge * 0.08
    + playerFitEdge * 0.08
    + cohesionEdge * 0.05
    + coachEdge * 0.03;
  // 实力越接近，平局概率越高；上下限避免出现不现实的 0% 或过高平局率。
  const drawProbability = clamp(0.24 - Math.abs(edge) * 0.0025, 0.12, 0.28);
  // 先从非平局概率中分配胜负，再用 clamp 限制极端概率。
  const teamAWinProbability = clamp((1 - drawProbability) * sigmoid(edge / 8.5), 0.04, 0.9);
  const teamBWinProbability = clamp(1 - drawProbability - teamAWinProbability, 0.04, 0.9);
  // 淘汰赛打平后还会进入加时/点球，因此用默契和教练调整能力做很小的修正。
  const extraTimeContext =
    ((profileA.squadCohesionScore ?? 80) - (profileB.squadCohesionScore ?? 80)) * 0.001
    + ((profileA.coachAdaptabilityScore ?? 80) - (profileB.coachAdaptabilityScore ?? 80)) * 0.001;
  const profileTeamAAdvanceProbability = clamp(
    teamAWinProbability + drawProbability * 0.5 + extraTimeContext,
    0.05,
    0.95,
  );
  const scheduledPrediction = matchNumber
    ? scheduledPredictionByMatchNumber.get(matchNumber)
    : undefined;
  const scheduledMatchesDirectly =
    scheduledPrediction?.teamAId === teamA.id && scheduledPrediction.teamBId === teamB.id;
  const scheduledMatchesReversed =
    scheduledPrediction?.teamAId === teamB.id && scheduledPrediction.teamBId === teamA.id;
  const routeTeamAAdvanceProbability = scheduledMatchesDirectly
    ? scheduledPrediction.teamAAdvanceProbability
    : scheduledMatchesReversed
      ? scheduledPrediction.teamBAdvanceProbability
      : undefined;
  const scheduledScorePrediction = scheduledMatchesDirectly
    ? scheduledPrediction.scorePrediction
    : scheduledMatchesReversed
      ? reverseScorePrediction(scheduledPrediction.scorePrediction)
      : undefined;
  // 已确定赛程的半决赛同时使用 Python 的逐场回测路线和网页球探画像。
  // 路线模型包含赛前实力、本届状态、历史分类器、温湿度、场馆、休息和旅行；
  // 球探画像保留伤停、战术适配、角色适配、默契和教练调整能力。
  const teamAAdvanceProbability =
    routeTeamAAdvanceProbability === undefined
      ? profileTeamAAdvanceProbability
      : clamp(profileTeamAAdvanceProbability * 0.45 + routeTeamAAdvanceProbability * 0.55, 0.05, 0.95);
  const teamBAdvanceProbability = clamp(1 - teamAAdvanceProbability, 0.05, 0.95);
  const gap = Math.abs(teamAAdvanceProbability - teamBAdvanceProbability);
  // 两队晋级概率差越大、球队画像本身越可靠，单场预测置信度越高。
  const confidenceScore = clamp(
    Math.round(50 + gap * 100 * 0.62 + Math.max(profileA.confidenceScore, profileB.confidenceScore) * 0.18),
    38,
    96,
  );
  // 只把本场影响最大的三个因素交给 UI，避免解释卡片堆满指标。
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
    .map((factor) => factor.key);
  const routeFactors =
    routeTeamAAdvanceProbability === undefined
      ? []
      : scheduledPrediction?.topFactors ?? [];
  const topFactors = [...new Set([...routeFactors, ...factors])].slice(0, 3);
  const expectedTeamAGoals90 = clamp(
    1.15
      + (profileA.attackTrend - 65) * 0.017
      - (profileB.defenseTrend - 65) * 0.013
      + tournamentFormEdge * 0.004
      + availabilityEdge * 0.002,
    0.2,
    4.2,
  );
  const expectedTeamBGoals90 = clamp(
    1.15
      + (profileB.attackTrend - 65) * 0.017
      - (profileA.defenseTrend - 65) * 0.013
      - tournamentFormEdge * 0.004
      - availabilityEdge * 0.002,
    0.2,
    4.2,
  );
  const profileSuggestsDraw =
    drawProbability >= 0.22
    && Math.abs(teamAWinProbability - teamBWinProbability) < 0.12;
  const desiredOutcome: OutcomeLabel = profileSuggestsDraw
    ? 1
    : teamAAdvanceProbability >= teamBAdvanceProbability
      ? 0
      : 2;
  const scheduledScoreWinner = scheduledScorePrediction
    ? Math.sign(scheduledScorePrediction.finalTeamAScore - scheduledScorePrediction.finalTeamBScore)
    : 0;
  const scheduledScoreMatchesRecommendation =
    scheduledScoreWinner === 0
    || (scheduledScoreWinner > 0 && desiredOutcome === 0)
    || (scheduledScoreWinner < 0 && desiredOutcome === 2);
  const scorePrediction =
    scheduledScorePrediction && scheduledScoreMatchesRecommendation
      ? scheduledScorePrediction
      : buildScorePrediction(
          scheduledScorePrediction?.expectedTeamAGoals90 ?? expectedTeamAGoals90,
          scheduledScorePrediction?.expectedTeamBGoals90 ?? expectedTeamBGoals90,
          scheduledScorePrediction
            && scheduledScorePrediction.regulationTeamAScore === scheduledScorePrediction.regulationTeamBScore
            ? 1
            : desiredOutcome,
          scheduledMatchesDirectly
            ? scheduledPrediction?.teamAEnvironmentReadiness
            : scheduledPrediction?.teamBEnvironmentReadiness,
          scheduledMatchesDirectly
            ? scheduledPrediction?.teamBEnvironmentReadiness
            : scheduledPrediction?.teamAEnvironmentReadiness,
        );

  return {
    teamAId: teamA.id,
    teamBId: teamB.id,
    teamAWinProbability,
    drawProbability,
    teamBWinProbability,
    teamAAdvanceProbability,
    teamBAdvanceProbability,
    topFactors,
    confidenceScore,
    upsetRisk: riskFromProbabilityGap(gap),
    scorePrediction,
  };
};

/** 根据晋级概率推荐胜者；概率差小于 8% 时，用综合实力和画像置信度依次破同分。 */
export const getRecommendedWinnerId = (
  teamA: Team | undefined,
  teamB: Team | undefined,
  players: Player[],
  matchNumber?: number,
) => {
  if (!teamA) return teamB?.id;
  if (!teamB) return teamA.id;
  const prediction = getMatchupPrediction(teamA, teamB, players, matchNumber);
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

type ProbabilityMap = Record<string, number>;

const addProbability = (target: ProbabilityMap, teamId: string, value: number) => {
  target[teamId] = (target[teamId] ?? 0) + value;
};

const roundProbability = (value: number) => Math.round(value * 1000) / 1000;

/**
 * 逐轮传播每支球队的路径概率，最终得到夺冠概率。
 * 例如 A 有 60% 进入下一轮、下一轮又有 50% 晋级，则该分支贡献 60% × 50% = 30%。
 */
export const getBracketChampionProbabilities = (
  teams: Team[],
  players: Player[],
  bracketState: BracketPredictionState,
  limit = 5,
) => {
  const matches = flattenMatches();
  const distributions = new Map<string, ProbabilityMap>();

  for (const match of matches) {
    const feederA = matches.find((candidate) => candidate.nextMatchId === match.id && candidate.nextSlot === "slotA");
    const feederB = matches.find((candidate) => candidate.nextMatchId === match.id && candidate.nextSlot === "slotB");
    const state = bracketState[match.id] ?? {};
    // 每个槽位不是只能有一支队，而是保存“哪些队可能来到这里，以及各自概率”。
    const distributionA = feederA
      ? distributions.get(feederA.id) ?? {}
      : state.slotA
        ? { [state.slotA]: 1 }
        : match.slotA.teamId
          ? { [match.slotA.teamId]: 1 }
          : {};
    const distributionB = feederB
      ? distributions.get(feederB.id) ?? {}
      : state.slotB
        ? { [state.slotB]: 1 }
        : match.slotB.teamId
          ? { [match.slotB.teamId]: 1 }
          : {};
    const resolvedWinner = match.actualWinnerTeamId ?? undefined;

    // 已结束比赛直接锁定真实胜者，负者不会因为旧 localStorage 预测继续出现在后续轮次。
    if (
      resolvedWinner &&
      ((distributionA[resolvedWinner] ?? 0) > 0 || (distributionB[resolvedWinner] ?? 0) > 0)
    ) {
      distributions.set(match.id, { [resolvedWinner]: 1 });
      continue;
    }

    const output: ProbabilityMap = {};
    // 枚举该场所有可能对阵，把“来到本场的路径概率”乘以“本场晋级概率”。
    for (const [teamAId, teamAPathProbability] of Object.entries(distributionA)) {
      for (const [teamBId, teamBPathProbability] of Object.entries(distributionB)) {
        const matchupPathProbability = teamAPathProbability * teamBPathProbability;
        if (!matchupPathProbability) continue;
        if (teamAId === teamBId) {
          addProbability(output, teamAId, matchupPathProbability);
          continue;
        }

        const teamA = teams.find((team) => team.id === teamAId);
        const teamB = teams.find((team) => team.id === teamBId);
        const prediction = getMatchupPrediction(teamA, teamB, players, match.matchNumber);
        if (!prediction) continue;

        addProbability(output, teamAId, matchupPathProbability * prediction.teamAAdvanceProbability);
        addProbability(output, teamBId, matchupPathProbability * prediction.teamBAdvanceProbability);
      }
    }

    distributions.set(match.id, output);
  }

  // 决赛输出分布就是所有仍可能夺冠球队的最终概率。
  const finalDistribution = distributions.get("final-1") ?? {};

  return Object.entries(finalDistribution)
    .map(([teamId, probability]) => {
      const team = teams.find((item) => item.id === teamId);
      if (!team) return null;
      return {
        team,
        profile: getModelProfile(team, players),
        championshipProbability: roundProbability(probability),
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .sort((a, b) => b.championshipProbability - a.championshipProbability || b.profile.mlStrengthScore - a.profile.mlStrengthScore)
    .slice(0, limit);
};

/** 找出弱队晋级概率较高、预测差距较小的潜在爆冷对阵。 */
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
      const prediction = getMatchupPrediction(teamA, teamB, players, match.matchNumber);
      if (!teamA || !teamB || !prediction) return null;
      const teamAFavored = prediction.teamAAdvanceProbability >= prediction.teamBAdvanceProbability;
      const favorite = teamAFavored ? teamA : teamB;
      const underdog = teamAFavored ? teamB : teamA;
      const underdogProbability = teamAFavored ? prediction.teamBAdvanceProbability : prediction.teamAAdvanceProbability;
      const favoriteProfile = getModelProfile(favorite, players);
      // 弱队概率是主体，风险等级和强队排名只做小幅排序修正。
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
