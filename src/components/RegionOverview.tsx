import { Globe2 } from "lucide-react";
import { useLanguage, type TranslationKey } from "../i18n";
import type { Team } from "../types/worldCup";
import { displayTeamName } from "../utils/localizedNames";
import { getTeamRegion, type RegionKey } from "../utils/insights";
import { TeamFlag } from "./TeamFlag";

interface RegionOverviewProps {
  teams: Team[];
}

const regionOrder: RegionKey[] = ["north-america", "south-america", "europe", "africa", "asia", "oceania"];

const regionTitleKey: Record<RegionKey, TranslationKey> = {
  "north-america": "regionNorthAmerica",
  "south-america": "regionSouthAmerica",
  europe: "regionEurope",
  africa: "regionAfrica",
  asia: "regionAsia",
  oceania: "regionOceania",
};

export const RegionOverview = ({ teams }: RegionOverviewProps) => {
  const { language, t } = useLanguage();

  return (
    <section className="glass-panel rounded-lg p-4">
      <div className="flex items-center gap-2">
        <Globe2 className="text-cyan-300" size={18} />
        <h2 className="text-lg font-black text-white light:text-slate-950">{t("regionTitle")}</h2>
      </div>
      <p className="mt-2 text-sm text-slate-400 light:text-slate-600">{t("regionDescription")}</p>
      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        {regionOrder.map((region) => {
          const regionTeams = teams
            .filter((team) => getTeamRegion(team.id) === region)
            .sort((a, b) => a.strengthRank - b.strengthRank);

          return (
            <article
              className="rounded-lg border border-white/10 bg-slate-950/35 p-4 light:border-slate-900/10 light:bg-white/80"
              key={region}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white light:text-slate-950">{t(regionTitleKey[region])}</h3>
                <span className="text-xs text-slate-400 light:text-slate-600">{regionTeams.length}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {regionTeams.map((team) => (
                  <span
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-200 light:border-slate-900/10 light:bg-slate-50 light:text-slate-700"
                    key={team.id}
                  >
                    <TeamFlag team={team} size="sm" />
                    {displayTeamName(team, language)}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
