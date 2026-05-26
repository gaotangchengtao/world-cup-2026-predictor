import { ArrowUpRight, Shield, Sparkles } from "lucide-react";
import { groupPositionLabel, qualityLabel, stageLabel } from "../utils/format";
import type { Team } from "../types/worldCup";

interface TeamCardProps {
  team: Team;
  onSelect: (team: Team) => void;
  compact?: boolean;
}

export const TeamCard = ({ team, onSelect, compact = false }: TeamCardProps) => (
  <button
    className={`group relative w-full rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:border-trophy-500 hover:shadow-glow ${
      team.strengthRank <= 8
        ? "border-trophy-500/50 bg-trophy-500/10"
        : "border-white/10 bg-white/[0.055] light:border-slate-900/10 light:bg-white/70"
    }`}
    onClick={() => onSelect(team)}
    type="button"
  >
    <span className="absolute right-3 top-3 rounded-md bg-slate-950 px-2 py-1 text-xs font-black text-trophy-300 light:bg-slate-900">
      #{team.strengthRank}
    </span>

    <div className="flex items-start gap-3 pr-12">
      <span className="text-4xl leading-none">{team.flag}</span>
      <div>
        <h3 className="text-base font-black text-white light:text-slate-950">{team.name}</h3>
        <p className="mt-1 text-xs text-slate-400 light:text-slate-600">Group {team.group} · Score {team.strengthScore}</p>
      </div>
    </div>

    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="rounded-md bg-emerald-400/15 px-2 py-1 text-xs font-bold text-emerald-200 light:text-emerald-700">
        {groupPositionLabel(team.predictedGroupPosition)}
      </span>
      <span className="rounded-md bg-sky-400/15 px-2 py-1 text-xs font-bold text-sky-200 light:text-sky-700">
        {stageLabel(team.predictedStage)}
      </span>
      {team.isDarkHorse && (
        <span className="inline-flex items-center gap-1 rounded-md bg-orange-400/15 px-2 py-1 text-xs font-bold text-orange-200 light:text-orange-700">
          <Sparkles size={12} />
          Dark Horse
        </span>
      )}
    </div>

    {!compact && (
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300 light:text-slate-600">
        <span className="inline-flex items-center gap-1">
          <Shield size={14} />
          {team.formation ?? "TBD"}
        </span>
        <span className="font-semibold text-trophy-300 light:text-trophy-700">{team.squadValue ?? "N/A"}</span>
        <span>{team.coach ?? "Coach TBD"}</span>
        <span>{qualityLabel(team.dataQuality)}</span>
      </div>
    )}

    <ArrowUpRight className="absolute bottom-3 right-3 text-slate-500 transition group-hover:text-trophy-300" size={16} />
  </button>
);
