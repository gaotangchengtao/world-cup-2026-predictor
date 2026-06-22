import { BarChart3, ShieldAlert, TrendingUp } from "lucide-react";
import { useLanguage } from "../i18n";
import type { Player, Team } from "../types/worldCup";
import { stageLabel } from "../utils/format";
import { displayPlayerName, displayTeamName } from "../utils/localizedNames";
import { getTeamExplanation, getTopTeamPlayers } from "../utils/insights";
import { getModelProfile } from "../utils/modelPredictions";

interface ExplanationCardProps {
  team: Team;
  players: Player[];
  compact?: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const ExplanationCard = ({ team, players, compact = false }: ExplanationCardProps) => {
  const { language, t } = useLanguage();
  const explanation = getTeamExplanation(team, players);
  const profile = getModelProfile(team, players);
  const topPlayers = getTopTeamPlayers(team.id, players);
  const confidence = clamp(profile.confidenceScore, 35, 95);
  const teamName = displayTeamName(team, language);
  const coreCount = players.filter((player) => player.teamId === team.id && player.isKeyPlayer).length;
  const advantages =
    language === "zh"
      ? [
          `当前综合强度 ${profile.mlStrengthScore}，同时纳入本届状态与人员可用性。`,
          `${coreCount} 名核心球员支撑关键位置。`,
          `预测阶段为 ${stageLabel(team.predictedStage, t)}。`,
        ]
      : [
          `Current-state score of ${profile.mlStrengthScore} blends tournament form and squad availability.`,
          `${coreCount} key players support the most important roles.`,
          `Projected stage: ${stageLabel(team.predictedStage, t)}.`,
        ];
  const risks =
    language === "zh"
      ? team.strengthRank <= 8
        ? ["热门球队压力更大，对手会更保守地限制核心区域。", "如果先丢球，比赛节奏会变得更复杂。"]
        : ["阵容深度不如传统强队，连续高强度比赛风险更高。", "需要把反击或定位球机会转化成进球。"]
      : team.strengthRank <= 8
        ? ["Favorites carry pressure and opponents may defend the core zones deeper.", "An early goal conceded can make the match rhythm more complicated."]
        : ["Squad depth is thinner than the traditional powers.", "Counters or set pieces must become real goals."];
  const upset =
    language === "zh"
      ? team.strengthRank <= 8
        ? "低到中等：强队仍可能被高强度逼抢、早早丢球或点球大战拖入麻烦。"
        : "中等：如果门将超常发挥、定位球得分或对手轮换失误，这支队有机会制造冷门。"
      : team.strengthRank <= 8
        ? "Low to medium: high pressing, an early concession, or penalties can still make a favorite vulnerable."
        : "Medium: a standout goalkeeper, a set-piece goal, or opponent rotation errors could create an upset window.";

  return (
    <section className={`rounded-lg border border-sky-400/20 bg-sky-500/10 ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-center gap-2">
        <BarChart3 className="text-sky-300" size={18} />
        <h3 className={`font-black text-white light:text-slate-950 ${compact ? "text-sm" : "text-lg"}`}>
          {t("predictionExplanation")}
        </h3>
      </div>
      <p className={`mt-2 text-slate-300 light:text-slate-700 ${compact ? "text-xs leading-5" : "text-sm leading-6"}`}>
        {language === "zh"
          ? `${teamName} 的预测综合本届赛事状态、人员可用性、战术适配、阵容默契、教练调整能力和时间衰减历史数据。`
          : `${teamName}'s projection combines current tournament form, availability, tactical fit, cohesion, coach adaptability, and recency-weighted history.`}
      </p>

      {!compact && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
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
      )}

      <div className={`mt-3 grid gap-3 ${compact ? "" : "lg:grid-cols-3"}`}>
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3">
          <p className="inline-flex items-center gap-1 text-sm font-black text-emerald-200 light:text-emerald-700">
            <TrendingUp size={15} />
            {t("keyAdvantages")}
          </p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-300 light:text-slate-700">
            {advantages.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-orange-400/20 bg-orange-500/10 p-3">
          <p className="inline-flex items-center gap-1 text-sm font-black text-orange-200 light:text-orange-700">
            <ShieldAlert size={15} />
            {t("mainRisks")}
          </p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-300 light:text-slate-700">
            {risks.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-sky-400/20 bg-sky-500/10 p-3">
          <p className="text-sm font-black text-sky-200 light:text-sky-700">{t("confidenceScore")}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-900/70 light:bg-slate-200">
            <div className="h-full rounded-full bg-sky-400" style={{ width: `${confidence}%` }} />
          </div>
          <p className="mt-1 text-sm font-black text-white light:text-slate-950">{confidence}/100</p>
        </div>
      </div>

      <p className={`mt-3 text-slate-300 light:text-slate-700 ${compact ? "text-xs leading-5" : "text-sm leading-6"}`}>
        <span className="font-bold text-orange-300 light:text-orange-700">{t("upsetPossibility")}: </span>
        {upset}
      </p>
      <p className={`mt-2 text-slate-300 light:text-slate-700 ${compact ? "text-xs leading-5" : "text-sm leading-6"}`}>
        {t("predictionExplanationPlayers")}{" "}
        {topPlayers.length > 0 ? topPlayers.map((player) => displayPlayerName(player, language)).join(" / ") : t("notSelected")}
      </p>
    </section>
  );
};
