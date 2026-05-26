import { ExternalLink, Shield, Star, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useLanguage } from "../i18n";
import type { Player, PlayerPosition, Team } from "../types/worldCup";
import { groupPositionLabel, qualityLabel, stageLabel } from "../utils/format";
import { PlayerCard } from "./PlayerCard";

interface TeamModalProps {
  team: Team;
  players: Player[];
  onClose: () => void;
  onSelectPlayer: (player: Player) => void;
}

const positionLabels: Array<"all" | PlayerPosition> = ["all", "GK", "DF", "MF", "FW"];

export const TeamModal = ({ team, players, onClose, onSelectPlayer }: TeamModalProps) => {
  const { t } = useLanguage();
  const [position, setPosition] = useState<"all" | PlayerPosition>("all");
  const [club, setClub] = useState("all");
  const [query, setQuery] = useState("");
  const [sortByValue, setSortByValue] = useState(true);

  const clubs = useMemo(() => ["all", ...Array.from(new Set(players.map((player) => player.club))).sort()], [players]);

  const visiblePlayers = useMemo(
    () =>
      players
        .filter((player) => position === "all" || player.position === position)
        .filter((player) => club === "all" || player.club === club)
        .filter((player) => player.name.toLowerCase().includes(query.trim().toLowerCase()))
        .sort((a, b) => (sortByValue ? b.marketValueEurM - a.marketValueEurM : a.position.localeCompare(b.position))),
    [club, players, position, query, sortByValue],
  );

  const totalValue = players.reduce((sum, player) => sum + player.marketValueEurM, 0);
  const keyPlayers = players.filter((player) => player.isKeyPlayer).length;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <article className="glass-panel max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-lg p-5">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-5 light:border-slate-900/10 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="text-6xl leading-none">{team.flag}</span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-3xl font-black text-white light:text-slate-950">{team.name}</h2>
                {team.isDarkHorse && (
                  <span className="rounded-md bg-orange-400/15 px-2 py-1 text-xs font-bold text-orange-200 light:text-orange-700">
                    {t("darkHorse")}
                  </span>
                )}
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 light:text-slate-700">{team.description}</p>
            </div>
          </div>
          <button
            className="self-end rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10 light:border-slate-900/10 light:text-slate-700 lg:self-start"
            onClick={onClose}
            title="Close team modal"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-trophy-500/30 bg-trophy-500/10 p-4">
            <p className="text-xs uppercase text-trophy-300 light:text-trophy-700">{t("strengthRank")}</p>
            <p className="mt-1 text-3xl font-black text-trophy-200 light:text-trophy-800">#{team.strengthRank}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4 light:border-slate-900/10 light:bg-slate-50">
            <p className="text-xs uppercase text-slate-500">{t("predictedStage")}</p>
            <p className="mt-1 font-black text-white light:text-slate-950">
              {groupPositionLabel(team.predictedGroupPosition, t)} · {stageLabel(team.predictedStage, t)}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4 light:border-slate-900/10 light:bg-slate-50">
            <p className="text-xs uppercase text-slate-500">
              {t("coach")} / {t("formation")}
            </p>
            <p className="mt-1 font-black text-white light:text-slate-950">
              {team.coach} · {team.formation}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4 light:border-slate-900/10 light:bg-slate-50">
            <p className="text-xs uppercase text-slate-500">{t("squadSnapshot")}</p>
            <p className="mt-1 font-black text-white light:text-slate-950">
              €{totalValue.toFixed(0)}m · {keyPlayers} {t("corePlayers")}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-4 light:border-slate-900/10 light:bg-slate-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-white light:text-slate-950">{t("playerList")}</h3>
              <p className="text-xs text-slate-400 light:text-slate-600">
                {t("updated")} {team.lastUpdated} · {qualityLabel(team.dataQuality, t)}
              </p>
            </div>
            <a
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10 light:border-slate-900/10 light:text-slate-700"
              href={team.sourceUrls[0]}
              rel="noreferrer"
              target="_blank"
            >
              {t("dataSource")}
              <ExternalLink size={15} />
            </a>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_0.7fr_0.7fr_auto]">
            <input
              className="h-10 rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm text-white outline-none focus:border-trophy-500 light:border-slate-900/10 light:bg-white light:text-slate-950"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlayers")}
              value={query}
            />
            <select
              className="h-10 rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm text-white outline-none focus:border-trophy-500 light:border-slate-900/10 light:bg-white light:text-slate-950"
              onChange={(event) => setPosition(event.target.value as "all" | PlayerPosition)}
              value={position}
            >
              {positionLabels.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? t("allPositions") : item}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm text-white outline-none focus:border-trophy-500 light:border-slate-900/10 light:bg-white light:text-slate-950"
              onChange={(event) => setClub(event.target.value)}
              value={club}
            >
              {clubs.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? t("allClubs") : item}
                </option>
              ))}
            </select>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-trophy-500 px-3 text-sm font-black text-slate-950 hover:bg-trophy-300"
              onClick={() => setSortByValue(!sortByValue)}
              type="button"
            >
              <Shield size={15} />
              {sortByValue ? t("sortByMarketValue") : t("sortByPosition")}
            </button>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {visiblePlayers.map((player) => (
              <PlayerCard key={player.playerId} player={player} onSelect={onSelectPlayer} />
            ))}
          </div>

          {visiblePlayers.length === 0 && (
            <p className="rounded-lg border border-white/10 p-4 text-sm text-slate-400 light:border-slate-900/10 light:text-slate-600">
              {t("noPlayers")}
            </p>
          )}
        </div>
      </article>
    </div>
  );
};
