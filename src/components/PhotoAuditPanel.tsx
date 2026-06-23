import { Camera } from "lucide-react";
import { useLanguage } from "../i18n";
import type { Player } from "../types/worldCup";
import { displayClubName, displayPlayerName } from "../utils/localizedNames";
import { summarizePhotos } from "../utils/insights";

interface PhotoAuditPanelProps {
  players: Player[];
}

export const PhotoAuditPanel = ({ players }: PhotoAuditPanelProps) => {
  const { language, t } = useLanguage();
  const summary = summarizePhotos(players);

  return (
    <section className="glass-panel rounded-lg p-4">
      <div className="flex items-center gap-2">
        <Camera className="text-orange-300" size={18} />
        <h2 className="text-lg font-black text-white light:text-slate-950">{t("photoPanelTitle")}</h2>
      </div>
      <p className="mt-2 text-sm text-slate-400 light:text-slate-600">{t("photoPanelDescription")}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-sky-400/20 bg-sky-500/10 p-4">
          <p className="text-xs uppercase text-sky-300 light:text-sky-700">{t("photoRealThumbs")}</p>
          <p className="mt-1 text-2xl font-black text-white light:text-slate-950">{summary.realThumbnails}</p>
        </div>
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-4">
          <p className="text-xs uppercase text-emerald-300 light:text-emerald-700">{t("photoManualCount")}</p>
          <p className="mt-1 text-2xl font-black text-white light:text-slate-950">{summary.manualPhotos}</p>
        </div>
        <div className="rounded-lg border border-orange-400/20 bg-orange-500/10 p-4">
          <p className="text-xs uppercase text-orange-300 light:text-orange-700">{t("photoPlaceholderCount")}</p>
          <p className="mt-1 text-2xl font-black text-white light:text-slate-950">{summary.placeholderPhotos}</p>
        </div>
      </div>
      <details className="mt-4 rounded-lg border border-white/10 bg-slate-950/35 light:border-slate-900/10 light:bg-white/80 sm:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3 text-sm font-black text-white light:text-slate-950">
          <span>{t("photoMissingList")}</span>
          <span className="rounded-md bg-orange-400/15 px-2 py-1 text-xs text-orange-200 light:text-orange-700">
            {summary.missingManualCandidates.length}
          </span>
        </summary>
        <div className="grid gap-2 border-t border-white/10 p-3 light:border-slate-900/10">
          {summary.missingManualCandidates.slice(0, 12).map((player) => (
            <div
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 light:border-slate-900/10 light:text-slate-700"
              key={player.playerId}
            >
              <p className="font-bold text-white light:text-slate-950">{displayPlayerName(player, language)}</p>
              <p className="text-xs text-slate-400 light:text-slate-600">
                {displayClubName(player.club, language)} · {player.marketValue ?? "N/A"}
              </p>
            </div>
          ))}
        </div>
      </details>
      <div className="mt-4 hidden rounded-lg border border-white/10 bg-slate-950/35 p-4 light:border-slate-900/10 light:bg-white/80 sm:block">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-black text-white light:text-slate-950">{t("photoMissingList")}</h3>
          <span className="text-xs text-slate-400 light:text-slate-600">{t("photoNoScrapeNote")}</span>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {summary.missingManualCandidates.slice(0, 12).map((player) => (
            <div
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 light:border-slate-900/10 light:text-slate-700"
              key={player.playerId}
            >
              <p className="font-bold text-white light:text-slate-950">{displayPlayerName(player, language)}</p>
              <p className="text-xs text-slate-400 light:text-slate-600">
                {displayClubName(player.club, language)} · {player.marketValue ?? "N/A"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
