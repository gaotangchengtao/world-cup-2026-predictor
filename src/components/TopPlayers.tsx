import { Star } from "lucide-react";
import { useLanguage } from "../i18n";
import type { Player, Team } from "../types/worldCup";
import { displayClubName, displayPlayerName } from "../utils/localizedNames";
import { PlayerAvatar } from "./PlayerAvatar";
import { PlayerStatusBadges } from "./PlayerStatusBadges";
import { TeamFlag } from "./TeamFlag";

interface TopPlayersProps {
  players: Player[];
  teams: Team[];
  onSelectPlayer: (player: Player) => void;
}

export const TopPlayers = ({ players, teams, onSelectPlayer }: TopPlayersProps) => {
  const { language, t } = useLanguage();
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const activePlayers = players.filter((player) => player.availabilityStatus !== "not-selected");
  const topValue = [...activePlayers].sort((a, b) => b.marketValueEurM - a.marketValueEurM).slice(0, 10);
  const topCore = [...activePlayers]
    .filter((player) => player.isKeyPlayer)
    .sort((a, b) => b.marketValueEurM - a.marketValueEurM)
    .slice(0, 10);

  const list = (title: string, rows: Player[]) => (
    <article className="glass-panel rounded-lg p-4">
      <h2 className="text-lg font-black text-white light:text-slate-950">{title}</h2>
      <div className="mt-4 grid gap-2">
        {rows.map((player, index) => {
          const team = teamById.get(player.teamId);
          return (
            <button
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-left transition hover:border-trophy-500 light:border-slate-900/10 light:bg-white"
              key={player.playerId}
              onClick={() => onSelectPlayer(player)}
              type="button"
            >
              <span className="w-6 text-center text-sm font-black text-trophy-300">#{index + 1}</span>
              <PlayerAvatar
                alt={displayPlayerName(player, language)}
                className="h-10 w-10 rounded-full object-cover"
                player={player}
              />
              <div className="min-w-0 flex-1">
                <p className="flex min-w-0 items-center gap-2 truncate text-sm font-bold text-white light:text-slate-950">
                  <TeamFlag team={team} size="sm" />
                  <span className="truncate">{displayPlayerName(player, language)}</span>
                </p>
                <p className="truncate text-xs text-slate-400 light:text-slate-600">
                  {displayClubName(player.club, language)}
                </p>
                <div className="mt-1">
                  <PlayerStatusBadges
                    availabilityStatus={player.availabilityStatus}
                    compact
                    marketValueStatus={player.marketValueStatus}
                  />
                </div>
              </div>
              {player.isKeyPlayer && <Star className="fill-trophy-500 text-trophy-500" size={14} />}
              <span className="text-sm font-black text-trophy-300 light:text-trophy-700">
                {player.marketValue ?? "N/A"}
              </span>
            </button>
          );
        })}
      </div>
    </article>
  );

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      {list(t("topMarketValueTitle"), topValue)}
      {list(t("topCorePlayersTitle"), topCore)}
    </section>
  );
};
