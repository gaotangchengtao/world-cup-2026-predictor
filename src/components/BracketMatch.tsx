import { Trophy } from "lucide-react";
import { useLanguage } from "../i18n";
import type { BracketMatch as BracketMatchType, BracketMatchState, Team } from "../types/worldCup";
import { getTeamById } from "../utils/format";
import { displayTeamName } from "../utils/localizedNames";
import { TeamFlag } from "./TeamFlag";

interface BracketMatchProps {
  match: BracketMatchType;
  matchState: BracketMatchState;
  teams: Team[];
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

export const BracketMatch = ({ match, matchState, teams, onSlotChange, onChooseWinner }: BracketMatchProps) => {
  const { t } = useLanguage();
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
    </article>
  );
};
