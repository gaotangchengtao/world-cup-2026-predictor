import { Clock3, Target } from "lucide-react";
import { useLanguage } from "../i18n";
import type { MatchScorePrediction } from "../types/worldCup";

interface PredictedScoreCardProps {
  score: MatchScorePrediction;
  teamAName: string;
  teamBName: string;
  compact?: boolean;
}

export const PredictedScoreCard = ({
  score,
  teamAName,
  teamBName,
  compact = false,
}: PredictedScoreCardProps) => {
  const { t } = useLanguage();
  const status = score.extraTimePlayed ? t("afterExtraTime") : t("regulationScore");

  return (
    <section className={compact ? "mt-3 border-t border-white/10 pt-3" : "mt-4 border-y border-white/10 py-4"}>
      <div className="flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-cyan-200 light:text-cyan-800">
          <Target size={14} />
          {t("predictedScore")}
        </p>
        <span className="text-[11px] font-bold text-slate-400 light:text-slate-600">{status}</span>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
        <p className="truncate text-xs font-bold text-slate-300 light:text-slate-700">{teamAName}</p>
        <p className={compact ? "text-2xl font-black text-white light:text-slate-950" : "text-4xl font-black text-white light:text-slate-950"}>
          {score.finalTeamAScore}
          <span className="mx-2 text-slate-500">-</span>
          {score.finalTeamBScore}
        </p>
        <p className="truncate text-xs font-bold text-slate-300 light:text-slate-700">{teamBName}</p>
      </div>

      {score.extraTimePlayed && (
        <p className="mt-2 text-center text-xs text-slate-400 light:text-slate-600">
          {t("regulationScore")} {score.regulationTeamAScore}-{score.regulationTeamBScore}
          <span className="mx-2">·</span>
          {t("extraTimeScore")} {score.extraTimeTeamAScore}-{score.extraTimeTeamBScore}
        </p>
      )}

      {!compact && (
        <p className="mt-2 flex items-center justify-center gap-1 text-xs text-slate-400 light:text-slate-600">
          <Clock3 size={13} />
          {t("expectedGoalsShort")} {score.expectedTeamAGoals90.toFixed(2)}-{score.expectedTeamBGoals90.toFixed(2)}
        </p>
      )}

      {score.decidedBy === "penalties" && (
        <p className="mt-2 text-center text-[11px] font-bold text-amber-200 light:text-amber-700">
          {t("penaltiesNotIncluded")}
        </p>
      )}
    </section>
  );
};
