import { ArrowUpRight, Shield, Sparkles } from "lucide-react";
import { useLanguage } from "../i18n";
import type { ExperienceMode, Team } from "../types/worldCup";
import { groupPositionLabel, stageLabel } from "../utils/format";
import { getBeginnerFriendlyRating } from "../utils/insights";
import { displayCoachName, displayTeamName } from "../utils/localizedNames";
import { getModelProfile } from "../utils/modelPredictions";
import { DataQualityBadge } from "./DataQualityBadge";
import { TeamFlag } from "./TeamFlag";

interface TeamCardProps {
  team: Team;
  onSelect: (team: Team) => void;
  compact?: boolean;
  experienceMode?: ExperienceMode;
}

export const TeamCard = ({ team, onSelect, compact = false, experienceMode = "expert" }: TeamCardProps) => {
  const { language, t } = useLanguage();
  const teamName = displayTeamName(team, language);
  const beginnerRating = getBeginnerFriendlyRating(team, []);
  const modelProfile = getModelProfile(team, []);
  const isBeginner = experienceMode === "beginner";

  return (
    <button
      className={`group team-card relative w-full rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-glow ${
        team.strengthRank <= 8
          ? "border-yellow-400/45 bg-yellow-400/[0.07]"
          : "border-white/10 bg-white/[0.055] light:border-slate-900/10 light:bg-white/70"
      }`}
      onClick={() => onSelect(team)}
      type="button"
    >
      <span className={`absolute right-3 top-3 rounded-md px-2 py-1 text-xs font-black ${
        isBeginner
          ? "bg-emerald-400 text-slate-950"
          : "bg-slate-950 text-trophy-300 light:bg-slate-900"
      }`}>
        {isBeginner ? `${beginnerRating}` : `#${team.strengthRank}`}
      </span>

      <div className="flex min-w-0 items-start gap-3 pr-12">
        <TeamFlag team={team} size="lg" />
        <div className="min-w-0">
          <h3 className="truncate text-base font-black text-white light:text-slate-950">{teamName}</h3>
          <p className="mt-1 text-xs text-slate-400 light:text-slate-600">
            {isBeginner
              ? `${t("group")} ${team.group} · ${stageLabel(team.predictedStage, t)}`
              : `${t("group")} ${team.group} · ${t("score")} ${team.strengthScore}`}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-emerald-400/15 px-2 py-1 text-xs font-bold text-emerald-200 light:text-emerald-700">
          {groupPositionLabel(team.predictedGroupPosition, t)}
        </span>
        <span className="rounded-md bg-sky-400/15 px-2 py-1 text-xs font-bold text-sky-200 light:text-sky-700">
          {stageLabel(team.predictedStage, t)}
        </span>
        {team.isDarkHorse && (
          <span className="inline-flex items-center gap-1 rounded-md bg-orange-400/15 px-2 py-1 text-xs font-bold text-orange-200 light:text-orange-700">
            <Sparkles size={12} />
            {t("darkHorse")}
          </span>
        )}
        {!isBeginner && <DataQualityBadge quality={team.dataQuality} compact />}
      </div>

      {!compact && (
        <>
          {experienceMode === "beginner" && (
            <div className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3">
              <p className="text-xs font-bold text-emerald-200 light:text-emerald-700">{t("beginnerFriendlyIndex")}</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-900/70 light:bg-slate-200">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${beginnerRating}%` }} />
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-300 light:text-slate-700">
                {team.isDarkHorse ? t("beginnerCardDarkHorseHint") : t("beginnerCardWatchHint")}
              </p>
            </div>
          )}
          {experienceMode === "expert" && (
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300 light:text-slate-600">
              <span className="inline-flex items-center gap-1">
                <Shield size={14} />
                {team.formation ?? t("notAvailable")}
              </span>
              <span className="font-semibold text-trophy-300 light:text-trophy-700">
                {team.squadValue ?? t("notAvailable")}
              </span>
              <span className="truncate">
                {displayCoachName(team.coach, language) || `${t("coach")} ${t("notAvailable")}`}
              </span>
              <span>{t("mlStrengthScore")}: {modelProfile.mlStrengthScore}</span>
            </div>
          )}
        </>
      )}

      <ArrowUpRight className="absolute bottom-3 right-3 text-slate-500 transition group-hover:text-trophy-300" size={16} />
    </button>
  );
};
