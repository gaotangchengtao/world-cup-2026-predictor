import { ExternalLink, Star, X } from "lucide-react";
import { useLanguage } from "../i18n";
import type { Player, Team } from "../types/worldCup";
import { qualityLabel } from "../utils/format";

interface PlayerModalProps {
  player: Player;
  team?: Team;
  onClose: () => void;
}

export const PlayerModal = ({ player, team, onClose }: PlayerModalProps) => {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
    <article className="glass-panel max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-lg p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            alt={player.name}
            className="h-20 w-20 rounded-full border border-trophy-500/40 object-cover"
            src={player.photoUrl}
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white light:text-slate-950">{player.name}</h2>
              {player.isKeyPlayer && <Star className="fill-trophy-500 text-trophy-500" size={20} />}
            </div>
            <p className="text-sm text-slate-400 light:text-slate-600">
              {team?.flag} {team?.name} · {player.position} · #{player.shirtNumber ?? "TBD"}
            </p>
          </div>
        </div>
        <button
          className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10 light:border-slate-900/10 light:text-slate-700"
          onClick={onClose}
          title="Close player modal"
          type="button"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 light:border-slate-900/10 light:bg-slate-50">
          <p className="text-xs uppercase text-slate-500">{t("club")}</p>
          <p className="mt-1 font-bold text-white light:text-slate-950">{player.club}</p>
        </div>
        <div className="rounded-lg border border-trophy-500/30 bg-trophy-500/10 p-4">
          <p className="text-xs uppercase text-trophy-300 light:text-trophy-700">{t("marketValue")}</p>
          <p className="mt-1 text-xl font-black text-trophy-200 light:text-trophy-800">{player.marketValue}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 light:border-slate-900/10 light:bg-slate-50">
          <p className="text-xs uppercase text-slate-500">{t("role")}</p>
          <p className="mt-1 font-bold text-white light:text-slate-950">
            {player.predictedStarter ? t("expectedStarter") : t("rotationPlayer")}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 light:border-slate-900/10 light:bg-slate-50">
          <p className="text-xs uppercase text-slate-500">{t("data")}</p>
          <p className="mt-1 font-bold text-white light:text-slate-950">
            {qualityLabel(player.dataQuality, t)} · {player.lastUpdated}
          </p>
        </div>
      </div>

      <a
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-trophy-500 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-trophy-300"
        href={player.transfermarktUrl}
        rel="noreferrer"
        target="_blank"
      >
        {t("transfermarktSearch")}
        <ExternalLink size={16} />
      </a>
      </article>
    </div>
  );
};
