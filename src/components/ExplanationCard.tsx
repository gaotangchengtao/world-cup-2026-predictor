import { BrainCircuit } from "lucide-react";
import { useLanguage } from "../i18n";
import type { Player, Team } from "../types/worldCup";
import { stageLabel } from "../utils/format";
import { displayPlayerName, displayTeamName } from "../utils/localizedNames";
import { getTeamExplanation, getTopTeamPlayers } from "../utils/insights";

interface ExplanationCardProps {
  team: Team;
  players: Player[];
  compact?: boolean;
}

export const ExplanationCard = ({ team, players, compact = false }: ExplanationCardProps) => {
  const { language, t } = useLanguage();
  const explanation = getTeamExplanation(team, players);
  const topPlayers = getTopTeamPlayers(team.id, players);

  return (
    <section className={`rounded-lg border border-sky-400/20 bg-sky-500/10 ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-center gap-2">
        <BrainCircuit className="text-sky-300" size={18} />
        <h3 className={`font-black text-white light:text-slate-950 ${compact ? "text-sm" : "text-lg"}`}>
          {t("predictionExplanation")}
        </h3>
      </div>
      <p className={`mt-2 text-slate-300 light:text-slate-700 ${compact ? "text-xs leading-5" : "text-sm leading-6"}`}>
        {t("predictionExplanationIntro")} {displayTeamName(team, language)}.
      </p>
      <div className={`mt-3 grid gap-2 ${compact ? "" : "sm:grid-cols-2"}`}>
        {explanation.map((item) => (
          <div
            className={`rounded-lg border px-3 py-2 ${
              item.emphasis === "positive"
                ? "border-emerald-400/30 bg-emerald-500/10"
                : "border-white/10 bg-slate-950/30 light:border-slate-900/10 light:bg-white/70"
            }`}
            key={item.key}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 light:text-slate-500">
              {item.key === "strengthScore"
                ? t("strengthScore")
                : item.key === "strengthRank"
                  ? t("strengthRank")
                  : item.key === "squadValue"
                    ? t("squadValue")
                    : item.key === "corePlayers"
                      ? t("corePlayers")
                      : t("predictedStage")}
            </p>
            <p className="mt-1 text-sm font-black text-white light:text-slate-950">
              {item.key === "predictedStage" ? stageLabel(team.predictedStage, t) : item.value}
            </p>
          </div>
        ))}
      </div>
      <p className={`mt-3 text-slate-300 light:text-slate-700 ${compact ? "text-xs leading-5" : "text-sm leading-6"}`}>
        {t("predictionExplanationPlayers")}{" "}
        {topPlayers.length > 0 ? topPlayers.map((player) => displayPlayerName(player, language)).join(" / ") : t("notSelected")}
      </p>
    </section>
  );
};
