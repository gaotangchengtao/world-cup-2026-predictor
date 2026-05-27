import { Eye } from "lucide-react";
import { groups } from "../data/groups";
import { useLanguage } from "../i18n";
import type { Team } from "../types/worldCup";
import { displayTeamName } from "../utils/localizedNames";
import { getWatchGuide } from "../utils/insights";
import { TeamFlag } from "./TeamFlag";

interface WatchGuidePanelProps {
  teams: Team[];
}

export const WatchGuidePanel = ({ teams }: WatchGuidePanelProps) => {
  const { language, t } = useLanguage();
  const insights = getWatchGuide(groups, teams);

  return (
    <section className="glass-panel rounded-lg p-4">
      <div className="flex items-center gap-2">
        <Eye className="text-emerald-300" size={18} />
        <h2 className="text-lg font-black text-white light:text-slate-950">{t("watchGuideTitle")}</h2>
      </div>
      <p className="mt-2 text-sm text-slate-400 light:text-slate-600">{t("watchGuideDescription")}</p>
      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {insights.map((insight) => (
          <article
            className="rounded-lg border border-white/10 bg-slate-950/35 p-4 light:border-slate-900/10 light:bg-white/80"
            key={insight.id}
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
              {t("group")} {insight.group}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <TeamFlag team={insight.teamA} size="sm" />
                <span className="text-sm font-black text-white light:text-slate-950">
                  {displayTeamName(insight.teamA, language)}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-500">vs</span>
              <div className="flex items-center gap-2">
                <TeamFlag team={insight.teamB} size="sm" />
                <span className="text-sm font-black text-white light:text-slate-950">
                  {displayTeamName(insight.teamB, language)}
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm font-bold text-emerald-200 light:text-emerald-700">{insight.angle[language]}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300 light:text-slate-700">{insight.whyWatch[language]}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
