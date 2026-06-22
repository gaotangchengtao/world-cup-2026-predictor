import { Check, Trophy } from "lucide-react";
import { useMemo } from "react";
import { defaultBracketRounds } from "../data/bracket";
import { useLanguage } from "../i18n";
import type {
  BracketMatch,
  BracketPredictionState,
  Player,
  Team,
} from "../types/worldCup";
import { getChampionId } from "../utils/bracket";
import { getTeamById } from "../utils/format";
import { displayTeamName } from "../utils/localizedNames";
import { getMatchupPrediction } from "../utils/modelPredictions";
import { TeamFlag } from "./TeamFlag";

interface ChampionshipRoadProps {
  teams: Team[];
  players: Player[];
  bracketState: BracketPredictionState;
  selectedMatchId?: string;
  onSelectMatch: (matchId: string) => void;
  onOpenTeamPicker: (matchId: string, slotKey: "slotA" | "slotB") => void;
}

interface RoadNode {
  match: BracketMatch;
  x: number;
  y: number;
  side: "top" | "bottom";
}

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 1880;
const NODE_WIDTH = 142;
const NODE_HEIGHT = 86;
const FINAL_WIDTH = 310;
const FINAL_HEIGHT = 214;
const FINAL_X = CANVAS_WIDTH / 2;
const FINAL_Y = 940;
const LEAF_START_X = 115;
const LEAF_SPACING = 150;

const topRoundY = {
  "round-32": 240,
  "round-16": 410,
  "quarter-finals": 590,
  "semi-finals": 755,
} as const;

const bottomRoundY = {
  "round-32": 1675,
  "round-16": 1470,
  "quarter-finals": 1290,
  "semi-finals": 1125,
} as const;

const roundLevel = {
  "round-32": 0,
  "round-16": 1,
  "quarter-finals": 2,
  "semi-finals": 3,
} as const;

const matchById = new Map(
  defaultBracketRounds.flatMap((round) => round.matches).map((match) => [match.id, match]),
);

const feederByTarget = new Map(
  defaultBracketRounds
    .flatMap((round) => round.matches)
    .filter((match) => match.nextMatchId && match.nextSlot)
    .map((match) => [`${match.nextMatchId}:${match.nextSlot}`, match]),
);

const collectHalfMatches = (rootMatchId: string) => {
  const levels: BracketMatch[][] = [[], [], [], []];

  const visit = (matchId: string) => {
    const match = matchById.get(matchId);
    if (!match || match.roundId === "final") return;

    const level = roundLevel[match.roundId as keyof typeof roundLevel];
    levels[level].push(match);

    const feederA = feederByTarget.get(`${match.id}:slotA`);
    const feederB = feederByTarget.get(`${match.id}:slotB`);
    if (feederA) visit(feederA.id);
    if (feederB) visit(feederB.id);
  };

  visit(rootMatchId);
  levels.forEach((matches) => matches.sort((matchA, matchB) => matchA.matchNumber - matchB.matchNumber));

  // Restore tree order so every parent sits exactly between its two feeders.
  const orderedLevels: BracketMatch[][] = [[], [], [], []];
  const appendTreeOrder = (matchId: string) => {
    const match = matchById.get(matchId);
    if (!match || match.roundId === "final") return;
    const level = roundLevel[match.roundId as keyof typeof roundLevel];
    orderedLevels[level].push(match);
    const feederA = feederByTarget.get(`${match.id}:slotA`);
    const feederB = feederByTarget.get(`${match.id}:slotB`);
    if (feederA) appendTreeOrder(feederA.id);
    if (feederB) appendTreeOrder(feederB.id);
  };
  appendTreeOrder(rootMatchId);

  return orderedLevels;
};

const getNodeX = (level: number, index: number) => {
  const leafSpan = 2 ** level;
  const leafCenterIndex = index * leafSpan + (leafSpan - 1) / 2;
  return LEAF_START_X + leafCenterIndex * LEAF_SPACING;
};

const buildRoadNodes = (rootMatchId: string, side: "top" | "bottom") => {
  const levels = collectHalfMatches(rootMatchId);
  const yByRound = side === "top" ? topRoundY : bottomRoundY;

  return levels.flatMap((matches, level) =>
    matches.map((match, index) => ({
      match,
      x: getNodeX(level, index),
      y: yByRound[match.roundId as keyof typeof yByRound],
      side,
    })),
  );
};

const topNodes = buildRoadNodes("sf-1", "top");
const bottomNodes = buildRoadNodes("sf-2", "bottom");
const allRoadNodes = [...topNodes, ...bottomNodes];
const positionByMatchId = new Map(allRoadNodes.map((node) => [node.match.id, node]));

const connectorPath = (node: RoadNode) => {
  const target = node.match.nextMatchId ? positionByMatchId.get(node.match.nextMatchId) : undefined;
  const isTop = node.side === "top";
  const startY = node.y + (isTop ? NODE_HEIGHT / 2 : -NODE_HEIGHT / 2);

  if (!target) {
    const targetY = isTop ? FINAL_Y - FINAL_HEIGHT / 2 : FINAL_Y + FINAL_HEIGHT / 2;
    const middleY = (startY + targetY) / 2;
    return `M ${node.x} ${startY} V ${middleY} H ${FINAL_X} V ${targetY}`;
  }

  const targetY = target.y + (isTop ? -NODE_HEIGHT / 2 : NODE_HEIGHT / 2);
  const middleY = (startY + targetY) / 2;
  return `M ${node.x} ${startY} V ${middleY} H ${target.x} V ${targetY}`;
};

const roundLabel = (roundId: string, t: ReturnType<typeof useLanguage>["t"]) => {
  if (roundId === "round-32") return t("stageRoundOf32");
  if (roundId === "round-16") return t("stageRoundOf16");
  if (roundId === "quarter-finals") return t("stageQuarterFinal");
  return t("stageSemiFinal");
};

export const ChampionshipRoad = ({
  teams,
  players,
  bracketState,
  selectedMatchId,
  onSelectMatch,
  onOpenTeamPicker,
}: ChampionshipRoadProps) => {
  const { language, t } = useLanguage();
  const championId = getChampionId(bracketState);
  const champion = getTeamById(teams, championId);
  const finalMatch = matchById.get("final-1");
  const finalState = bracketState["final-1"] ?? {};
  const finalistA = getTeamById(teams, finalState.slotA);
  const finalistB = getTeamById(teams, finalState.slotB);

  const championRouteMatchIds = useMemo(
    () =>
      new Set(
        allRoadNodes
          .filter((node) => bracketState[node.match.id]?.winnerTeamId === championId)
          .map((node) => node.match.id),
      ),
    [bracketState, championId],
  );

  return (
    <div
      className="championship-road-canvas relative overflow-hidden"
      style={{ height: CANVAS_HEIGHT, width: CANVAS_WIDTH }}
    >
      <div className="road-corner road-corner-left" />
      <div className="road-corner road-corner-right" />
      <div className="absolute inset-x-0 top-7 text-center">
        <p className="text-sm font-black uppercase tracking-[0.28em] text-sky-200">
          {t("roadKicker")}
        </p>
        <h2 className="mt-2 text-5xl font-black text-yellow-300">
          {t("roadTitle")}
        </h2>
        <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#06113a]/70 px-5 py-2 text-sm font-bold text-slate-200">
          <span>{t("roadChampionPrediction")}</span>
          <span className="text-yellow-300">
            {champion ? displayTeamName(champion, language) : t("notSelected")}
          </span>
        </div>
      </div>

      <span className="absolute left-1/2 top-0" id="road-top" />
      <span className="absolute left-1/2" id="road-final" style={{ top: FINAL_Y }} />
      <span className="absolute bottom-0 left-1/2" id="road-bottom" />

      <RoadRoundLabels side="top" />
      <RoadRoundLabels side="bottom" />

      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
      >
        {allRoadNodes.map((node) => {
          const path = connectorPath(node);
          const isChampionRoute = championRouteMatchIds.has(node.match.id);
          const isSelected = selectedMatchId === node.match.id;
          return (
            <g key={`${node.match.id}-connector`}>
              <path
                className="cursor-pointer"
                d={path}
                fill="none"
                onClick={() => onSelectMatch(node.match.id)}
                stroke="transparent"
                strokeWidth={18}
              />
              <path
                className="pointer-events-none transition-all"
                d={path}
                fill="none"
                stroke={isChampionRoute ? "#fde047" : isSelected ? "#38bdf8" : "#114b82"}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={isChampionRoute ? 6 : isSelected ? 5 : 3}
              />
            </g>
          );
        })}
      </svg>

      {allRoadNodes.map((node) => (
        <RoadMatchNode
          bracketState={bracketState}
          isChampionRoute={championRouteMatchIds.has(node.match.id)}
          isSelected={selectedMatchId === node.match.id}
          key={node.match.id}
          match={node.match}
          onOpenTeamPicker={onOpenTeamPicker}
          onSelectMatch={onSelectMatch}
          players={players}
          teams={teams}
          x={node.x}
          y={node.y}
        />
      ))}

      {finalMatch && (
        <section
          className={`road-final-stage absolute ${
            selectedMatchId === finalMatch.id ? "road-final-stage-selected" : ""
          }`}
          onClick={() => onSelectMatch(finalMatch.id)}
          style={{
            height: FINAL_HEIGHT,
            left: FINAL_X - FINAL_WIDTH / 2,
            top: FINAL_Y - FINAL_HEIGHT / 2,
            width: FINAL_WIDTH,
          }}
        >
          <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-200">
            {t("stageFinal")} · M{finalMatch.matchNumber}
          </p>
          <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <FinalistButton
              isWinner={finalState.winnerTeamId === finalistA?.id}
              onClick={() => onOpenTeamPicker(finalMatch.id, "slotA")}
              team={finalistA}
            />
            <span className="text-xs font-black text-slate-500">VS</span>
            <FinalistButton
              isWinner={finalState.winnerTeamId === finalistB?.id}
              onClick={() => onOpenTeamPicker(finalMatch.id, "slotB")}
              team={finalistB}
            />
          </div>
          <div className="mt-3 flex items-center justify-center gap-3 border-t border-white/10 pt-3">
            <Trophy className="text-yellow-300" size={40} strokeWidth={1.8} />
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {t("champion")}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <TeamFlag team={champion} size="lg" />
                <span className="max-w-32 truncate text-lg font-black text-white">
                  {champion ? displayTeamName(champion, language) : t("notSelected")}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

const RoadRoundLabels = ({ side }: { side: "top" | "bottom" }) => {
  const { t } = useLanguage();
  const yByRound = side === "top" ? topRoundY : bottomRoundY;

  return (
    <>
      {(["round-32", "round-16", "quarter-finals", "semi-finals"] as const).map((roundId) => (
        <div
          className="absolute left-1/2 z-10 -translate-x-1/2 rounded-md border border-sky-400/20 bg-[#081a55]/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-sky-200"
          key={`${side}-${roundId}`}
          style={{
            top:
              yByRound[roundId] +
              (side === "top" ? -NODE_HEIGHT / 2 - 34 : NODE_HEIGHT / 2 + 10),
          }}
        >
          {roundLabel(roundId, t)}
        </div>
      ))}
    </>
  );
};

interface RoadMatchNodeProps {
  match: BracketMatch;
  teams: Team[];
  players: Player[];
  bracketState: BracketPredictionState;
  x: number;
  y: number;
  isSelected: boolean;
  isChampionRoute: boolean;
  onSelectMatch: (matchId: string) => void;
  onOpenTeamPicker: (matchId: string, slotKey: "slotA" | "slotB") => void;
}

const RoadMatchNode = ({
  match,
  teams,
  players,
  bracketState,
  x,
  y,
  isSelected,
  isChampionRoute,
  onSelectMatch,
  onOpenTeamPicker,
}: RoadMatchNodeProps) => {
  const { language, t } = useLanguage();
  const matchState = bracketState[match.id] ?? {};
  const teamA = getTeamById(teams, matchState.slotA);
  const teamB = getTeamById(teams, matchState.slotB);
  const prediction = getMatchupPrediction(teamA, teamB, players);

  return (
    <article
      className={`road-match-node absolute z-10 ${
        isSelected ? "road-match-node-selected" : ""
      } ${isChampionRoute ? "road-match-node-champion" : ""}`}
      onClick={() => onSelectMatch(match.id)}
      style={{
        height: NODE_HEIGHT,
        left: x - NODE_WIDTH / 2,
        top: y - NODE_HEIGHT / 2,
        width: NODE_WIDTH,
      }}
    >
      <div className="flex items-center justify-between px-2 pt-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
        <span>M{match.matchNumber}</span>
        {prediction && (
          <span>{Math.round(Math.max(prediction.teamAAdvanceProbability, prediction.teamBAdvanceProbability) * 100)}%</span>
        )}
      </div>
      <div className="mt-1 grid gap-1 px-1.5 pb-1.5">
        <RoadTeamButton
          isWinner={matchState.winnerTeamId === teamA?.id}
          onClick={() => onOpenTeamPicker(match.id, "slotA")}
          team={teamA}
          teamName={teamA ? displayTeamName(teamA, language) : t("selectTeam")}
        />
        <RoadTeamButton
          isWinner={matchState.winnerTeamId === teamB?.id}
          onClick={() => onOpenTeamPicker(match.id, "slotB")}
          team={teamB}
          teamName={teamB ? displayTeamName(teamB, language) : t("selectTeam")}
        />
      </div>
    </article>
  );
};

const RoadTeamButton = ({
  team,
  teamName,
  isWinner,
  onClick,
}: {
  team?: Team;
  teamName: string;
  isWinner: boolean;
  onClick: () => void;
}) => (
  <button
    className={`group flex h-7 min-w-0 items-center gap-1.5 rounded border px-1.5 text-left transition ${
      isWinner
        ? "border-yellow-300/50 bg-yellow-300/10 text-yellow-100"
        : "border-white/10 bg-white/[0.035] text-slate-200 hover:border-sky-300/50"
    }`}
    onClick={(event) => {
      event.stopPropagation();
      onClick();
    }}
    title={teamName}
    type="button"
  >
    <TeamFlag team={team} size="sm" />
    <span className="min-w-0 flex-1 truncate text-[10px] font-bold">{teamName}</span>
    {isWinner && <Check className="shrink-0 text-yellow-300" size={11} strokeWidth={3} />}
  </button>
);

const FinalistButton = ({
  team,
  isWinner,
  onClick,
}: {
  team?: Team;
  isWinner: boolean;
  onClick: () => void;
}) => {
  const { language, t } = useLanguage();
  return (
    <button
      className={`min-w-0 rounded-lg border p-2 transition ${
        isWinner
          ? "border-yellow-300 bg-yellow-300/15 shadow-[0_0_24px_rgba(253,224,71,0.2)]"
          : "border-white/10 bg-white/5 hover:border-sky-300/50"
      }`}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      type="button"
    >
      <div className="flex justify-center">
        <TeamFlag team={team} size="lg" />
      </div>
      <p className="mt-1 truncate text-[11px] font-black text-white">
        {team ? displayTeamName(team, language) : t("selectTeam")}
      </p>
    </button>
  );
};
