import { ShieldCheck } from "lucide-react";
import { useLanguage, type TranslationKey } from "../i18n";
import type { DataQuality, Player, Team } from "../types/worldCup";
import { qualityLabel } from "../utils/format";
import { summarizeDataQuality } from "../utils/insights";

interface DataQualityPanelProps {
  teams: Team[];
  players: Player[];
}

const qualityMeaningKey: Record<DataQuality, TranslationKey> = {
  official: "qualityMeaningOfficial",
  "official-placeholder": "qualityMeaningOfficialPlaceholder",
  estimated: "qualityMeaningEstimated",
  projected: "qualityMeaningProjected",
  mock: "qualityMeaningMock",
  manual: "qualityMeaningManual",
} as const;

export const DataQualityPanel = ({ teams, players }: DataQualityPanelProps) => {
  const { t } = useLanguage();
  const rows = summarizeDataQuality(teams, players);

  return (
    <section className="glass-panel rounded-lg p-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="text-sky-300" size={18} />
        <h2 className="text-lg font-black text-white light:text-slate-950">{t("qualityPanelTitle")}</h2>
      </div>
      <p className="mt-2 text-sm text-slate-400 light:text-slate-600">{t("qualityPanelDescription")}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <article
            className="rounded-lg border border-white/10 bg-slate-950/35 p-4 light:border-slate-900/10 light:bg-white/80"
            key={row.key}
          >
            <p className="text-sm font-black text-white light:text-slate-950">{qualityLabel(row.key, t)}</p>
            <p className="mt-1 text-2xl font-black text-trophy-300 light:text-trophy-700">{row.count}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300 light:text-slate-700">
              {t(qualityMeaningKey[row.key])}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};
