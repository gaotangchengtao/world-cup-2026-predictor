import { ExternalLink, Star, X } from "lucide-react";
import { useLanguage } from "../i18n";
import type { Player, Team } from "../types/worldCup";
import { qualityLabel } from "../utils/format";
import { displayClubName, displayPlayerName, displayTeamName } from "../utils/localizedNames";
import { photoSourceLabel } from "../utils/photos";
import { PlayerAvatar } from "./PlayerAvatar";
import { TeamFlag } from "./TeamFlag";

interface PlayerModalProps {
  player: Player;
  team?: Team;
  onClose: () => void;
}

export const PlayerModal = ({ player, team, onClose }: PlayerModalProps) => {
  const { language, t } = useLanguage();
  const playerName = displayPlayerName(player, language);
  const teamName = displayTeamName(team, language);
  const clubName = displayClubName(player.club, language);
  const photoSource = player.photoSource === "placeholder" ? "wikimedia" : player.photoSource;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <article className="glass-panel max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-lg p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <PlayerAvatar
              alt={playerName}
              className="h-20 w-20 rounded-full border border-trophy-500/40 object-cover"
              player={player}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white light:text-slate-950">{playerName}</h2>
                {player.isKeyPlayer && <Star className="fill-trophy-500 text-trophy-500" size={20} />}
              </div>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-400 light:text-slate-600">
                <TeamFlag team={team} size="sm" />
                <span>
                  {teamName || "N/A"} · {player.position} · #{player.shirtNumber ?? "TBD"}
                </span>
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
            <p className="mt-1 font-bold text-white light:text-slate-950">{clubName}</p>
          </div>
          <div className="rounded-lg border border-trophy-500/30 bg-trophy-500/10 p-4">
            <p className="text-xs uppercase text-trophy-300 light:text-trophy-700">{t("marketValue")}</p>
            <p className="mt-1 text-xl font-black text-trophy-200 light:text-trophy-800">
              {player.marketValue ?? "N/A"}
            </p>
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
              {qualityLabel(player.dataQuality, t)} · {player.lastUpdated ?? "N/A"}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4 light:border-slate-900/10 light:bg-slate-50 sm:col-span-2">
            <p className="text-xs uppercase text-slate-500">{t("photoSource")}</p>
            <p className="mt-1 font-bold text-white light:text-slate-950">
              {photoSourceLabel(photoSource, t)}
            </p>
            <p className="mt-1 text-xs text-slate-400 light:text-slate-600">
              {player.photoCredit ? `${t("photoCredit")}: ${player.photoCredit}` : t("photoAutoLookupNote")}
              {player.photoLastUpdated ? ` · ${t("updated")} ${player.photoLastUpdated}` : ""}
            </p>
          </div>
        </div>

        {player.transfermarktUrl && (
          <a
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-trophy-500 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-trophy-300"
            href={player.transfermarktUrl}
            rel="noreferrer"
            target="_blank"
          >
            {t("transfermarktSearch")}
            <ExternalLink size={16} />
          </a>
        )}
      </article>
    </div>
  );
};
