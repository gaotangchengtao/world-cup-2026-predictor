import { Star } from "lucide-react";
import type { Player } from "../types/worldCup";

interface PlayerCardProps {
  player: Player;
  onSelect: (player: Player) => void;
}

export const PlayerCard = ({ player, onSelect }: PlayerCardProps) => (
  <button
    className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-slate-950/45 p-3 text-left transition hover:border-trophy-500 hover:bg-slate-900/90 light:border-slate-900/10 light:bg-white light:hover:bg-slate-50"
    onClick={() => onSelect(player)}
    type="button"
  >
    <img
      alt={player.name}
      className="h-12 w-12 rounded-full border border-white/10 object-cover"
      src={player.photoUrl}
    />
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <h4 className="truncate text-sm font-black text-white light:text-slate-950">{player.name}</h4>
        {player.isKeyPlayer && <Star className="shrink-0 fill-trophy-500 text-trophy-500" size={14} />}
      </div>
      <p className="truncate text-xs text-slate-400 light:text-slate-600">
        {player.position} · {player.club} · {player.age}
      </p>
    </div>
    <div className="text-right">
      <p className="text-sm font-black text-trophy-300 light:text-trophy-700">{player.marketValue}</p>
      {player.predictedStarter && <p className="text-[11px] font-bold text-emerald-300 light:text-emerald-700">Starter</p>}
    </div>
  </button>
);
