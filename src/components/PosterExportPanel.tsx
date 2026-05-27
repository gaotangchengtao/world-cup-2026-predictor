import { Download } from "lucide-react";
import { useLanguage } from "../i18n";
import type { BracketPredictionState, Player, Team } from "../types/worldCup";
import { buildPosterExport, buildPosterHtml } from "../utils/insights";

interface PosterExportPanelProps {
  teams: Team[];
  players: Player[];
  bracketState: BracketPredictionState;
}

const downloadFile = (filename: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const PosterExportPanel = ({ teams, players, bracketState }: PosterExportPanelProps) => {
  const { t } = useLanguage();
  const posterData = buildPosterExport(teams, players, bracketState);

  return (
    <section className="glass-panel rounded-lg p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-black text-white light:text-slate-950">{t("posterTitle")}</h2>
          <p className="text-sm text-slate-400 light:text-slate-600">{t("posterDescription")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10 light:border-slate-900/10 light:text-slate-700"
            onClick={() => downloadFile("wc2026-poster-summary.json", JSON.stringify(posterData, null, 2), "application/json")}
            type="button"
          >
            <Download size={16} />
            {t("posterExportJson")}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-trophy-500 px-3 py-2 text-sm font-black text-slate-950 hover:bg-trophy-300"
            onClick={() => downloadFile("wc2026-poster-summary.html", buildPosterHtml(teams, players, bracketState), "text/html")}
            type="button"
          >
            <Download size={16} />
            {t("posterExportHtml")}
          </button>
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-trophy-500/30 bg-trophy-500/10 p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-trophy-300 light:text-trophy-700">{t("champion")}</p>
        <p className="mt-1 text-2xl font-black text-white light:text-slate-950">
          {posterData.champion?.name ?? t("notSelected")}
        </p>
        <p className="mt-2 text-sm text-slate-300 light:text-slate-700">{t("posterFallbackNote")}</p>
      </div>
    </section>
  );
};
