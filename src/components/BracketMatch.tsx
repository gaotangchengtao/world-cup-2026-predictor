import { Trophy } from "lucide-react";
import { useLanguage } from "../i18n";
import type { BracketMatch as BracketMatchType, BracketMatchState, Player, Team } from "../types/worldCup";
import { getTeamById } from "../utils/format";
import { displayTeamName } from "../utils/localizedNames";
import { getMatchupPrediction, getRecommendedWinnerId } from "../utils/modelPredictions";
import { ExplanationCard } from "./ExplanationCard";
import { TeamFlag } from "./TeamFlag";

interface BracketMatchProps {
  match: BracketMatchType;
  matchState: BracketMatchState;
  teams: Team[];
  players: Player[];
  onSlotChange: (matchId: string, slotKey: "slotA" | "slotB", teamId: string) => void;
  onChooseWinner: (matchId: string, teamId: string) => void;
}

interface SlotProps {
  label: string;
  slotKey: "slotA" | "slotB";
  teamId?: string;
  teams: Team[];
  isWinner: boolean;
  onSlotChange: (teamId: string) => void;
  onChooseWinner: (teamId: string) => void;
}

const BracketSlot = ({ label, slotKey, teamId, teams, isWinner, onSlotChange, onChooseWinner }: SlotProps) => {
  const { language, t } = useLanguage();
  const team = getTeamById(teams, teamId);
  const sortedTeams = [...teams].sort((a, b) => a.strengthRank - b.strengthRank);

  return (
    <div
      className={`relative rounded-lg border p-3 transition ${
        isWinner
          ? "border-trophy-500 bg-trophy-500/15 shadow-glow"
          : "border-white/10 bg-white/5 hover:border-trophy-500/70 light:border-slate-900/10 light:bg-white"
      }`}
      onClick={() => teamId && onChooseWinner(teamId)}
      role="button"
      tabIndex={0}
    >
      {team && (
        <span className="absolute right-2 top-2 rounded bg-slate-950 px-1.5 py-0.5 text-[10px] font-black text-trophy-300 light:bg-slate-900">
          #{team.strengthRank}
        </span>
      )}
      <p className="pr-10 text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <TeamFlag team={team} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-white light:text-slate-950">
            {team ? displayTeamName(team, language) : t("selectTeam")}
          </p>
          <p className="text-xs text-slate-400 light:text-slate-600">
            {team
              ? `${t("group")} ${team.group} · ${t("score")} ${team.strengthScore}`
              : slotKey === "slotA"
                ? t("upperSlot")
                : t("lowerSlot")}
          </p>
        </div>
        <Trophy className={isWinner ? "text-trophy-300" : "text-slate-500"} size={16} />
      </div>
      <select
        className="mt-3 h-9 w-full rounded-md border border-white/10 bg-slate-950/80 px-2 text-xs text-white outline-none focus:border-trophy-500 light:border-slate-900/10 light:bg-white light:text-slate-950"
        onChange={(event) => onSlotChange(event.target.value)}
        onClick={(event) => event.stopPropagation()}
        value={teamId ?? ""}
      >
        <option value="">{t("selectTeam")}</option>
        {sortedTeams.map((option) => (
          <option key={option.id} value={option.id}>
            #{option.strengthRank} {displayTeamName(option, language)}
          </option>
        ))}
      </select>
    </div>
  );
};

export const BracketMatch = ({ match, matchState, teams, players, onSlotChange, onChooseWinner }: BracketMatchProps) => {
  const { language, t } = useLanguage();
  const teamA = getTeamById(teams, matchState.slotA);
  const teamB = getTeamById(teams, matchState.slotB);
  const probabilities = getMatchupPrediction(teamA, teamB, players, match.matchNumber);
  const recommendedWinnerId = getRecommendedWinnerId(teamA, teamB, players, match.matchNumber);
  const favorite = recommendedWinnerId === teamA?.id ? teamA : recommendedWinnerId === teamB?.id ? teamB : undefined;
  const noteLabels = {
    mlStrength: t("mlStrengthScore"),
    recentForm: t("recentFormScore"),
    currentTournamentForm: t("currentTournamentForm"),
    preTournamentPrior: t("preTournamentPrior"),
    historicalClassifier: t("historicalClassifier"),
    environmentReadiness: t("environmentReadiness"),
    attackDefense: t("attackDefenseBalance"),
    squadAvailability: t("squadAvailability"),
    tacticalFit: t("tacticalFit"),
    playerFit: t("playerFit"),
    squadCohesion: t("squadCohesion"),
    coachAdaptability: t("coachAdaptability"),
    strengthRank: t("strengthRank"),
    squadValue: t("squadValue"),
  };
  const roundName =
    match.roundId === "round-32"
      ? t("stageRoundOf32")
      : match.roundId === "round-16"
        ? t("stageRoundOf16")
        : match.roundId === "quarter-finals"
          ? t("stageQuarterFinal")
          : match.roundId === "semi-finals"
            ? t("stageSemiFinal")
            : t("stageFinal");

  return (
    <article className="relative min-w-[280px] rounded-lg border border-white/10 bg-slate-950/50 p-3 light:border-slate-900/10 light:bg-slate-50">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
          {t("match")} {match.matchNumber}
        </p>
        <span className="rounded-md bg-white/5 px-2 py-1 text-[11px] font-bold text-slate-300 light:bg-white light:text-slate-600">
          {roundName}
        </span>
      </div>
      <div className="grid gap-2">
        <BracketSlot
          isWinner={matchState.winnerTeamId === matchState.slotA}
          label={match.slotA.label}
          onChooseWinner={(teamId) => onChooseWinner(match.id, teamId)}
          onSlotChange={(teamId) => onSlotChange(match.id, "slotA", teamId)}
          slotKey="slotA"
          teamId={matchState.slotA}
          teams={teams}
        />
        <BracketSlot
          isWinner={matchState.winnerTeamId === matchState.slotB}
          label={match.slotB.label}
          onChooseWinner={(teamId) => onChooseWinner(match.id, teamId)}
          onSlotChange={(teamId) => onSlotChange(match.id, "slotB", teamId)}
          slotKey="slotB"
          teamId={matchState.slotB}
          teams={teams}
        />
      </div>
      {probabilities && teamA && teamB && (
        <div className="mt-3 rounded-lg border border-sky-400/20 bg-sky-500/10 p-3">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.16em] text-sky-200 light:text-sky-800">
            <span>{t("advanceProbability")}</span>
            <span>{t("integratedPrediction")}</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-900/70 light:bg-slate-200">
            <div className="flex h-full">
              <div className="bg-emerald-400" style={{ width: `${(probabilities.teamAAdvanceProbability * 100).toFixed(1)}%` }} />
              <div className="bg-orange-400" style={{ width: `${(probabilities.teamBAdvanceProbability * 100).toFixed(1)}%` }} />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-300 light:text-slate-700">
            <span>{displayTeamName(teamA, language)}</span>
            <span>{Math.round(probabilities.teamAAdvanceProbability * 100)}% - {Math.round(probabilities.teamBAdvanceProbability * 100)}%</span>
            <span>{displayTeamName(teamB, language)}</span>
          </div>
          <p className="mt-2 text-xs text-slate-400 light:text-slate-600">
            {t("predictionFactors")} {probabilities.topFactors.map((note) => noteLabels[note as keyof typeof noteLabels]).join(" / ")}
          </p>
        </div>
      )}
      {favorite && (
        <div className="mt-3">
          <ExplanationCard compact players={players} team={favorite} />
        </div>
      )}
    </article>
  );
};
