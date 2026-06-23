import { Star } from "lucide-react";
import { useLanguage } from "../i18n";
import type { Player } from "../types/worldCup";
import { playerPositionLabel, squadStatusLabel } from "../utils/format";
import { displayClubName, displayPlayerName } from "../utils/localizedNames";
import { photoSourceLabel } from "../utils/photos";
import { PlayerAvatar } from "./PlayerAvatar";
import { PlayerStatusBadges } from "./PlayerStatusBadges";

interface PlayerCardProps {
  player: Player;
  onSelect: (player: Player) => void;
}

export const PlayerCard = ({ player, onSelect }: PlayerCardProps) => {
  const { language, t } = useLanguage();
  const playerName = displayPlayerName(player, language);
  const clubName = displayClubName(player.club, language, player.localizedClubZh);
  const photoSource = player.photoSource;
  const photoTitle = `${t("photoSource")}: ${photoSourceLabel(photoSource, t)}. ${t("photoAutoLookupNote")}`;

  return (
    <button
      className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-slate-950/45 p-3 text-left transition hover:border-trophy-500 hover:bg-slate-900/90 light:border-slate-900/10 light:bg-white light:hover:bg-slate-50"
      onClick={() => onSelect(player)}
      type="button"
    >
      <PlayerAvatar
        alt={playerName}
        className="h-12 w-12 rounded-full border border-white/10 object-cover"
        player={player}
        title={photoTitle}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="truncate text-sm font-black text-white light:text-slate-950">{playerName}</h4>
          {player.isKeyPlayer && <Star className="shrink-0 fill-trophy-500 text-trophy-500" size={14} />}
        </div>
        <p className="truncate text-xs text-slate-400 light:text-slate-600">
          {playerPositionLabel(player.position, t)} · {clubName || t("notAvailable")} ·{" "}
          {player.age ?? t("notAvailable")}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-black text-trophy-300 light:text-trophy-700">
          {player.marketValue ?? t("notAvailable")}
        </p>
        <p className="text-[11px] font-bold text-sky-300 light:text-sky-700">
          {squadStatusLabel(player.squadStatus, t)}
        </p>
        <div className="mt-1 flex justify-end">
          <PlayerStatusBadges
            availabilityStatus={player.availabilityStatus}
            compact
            marketValueStatus={player.marketValueStatus}
          />
        </div>
        {player.predictedStarter && (
          <p className="text-[11px] font-bold text-emerald-300 light:text-emerald-700">{t("starter")}</p>
        )}
      </div>
    </button>
  );
};
