import { ExternalLink, Shield, Star, X } from "lucide-react";
import { useMemo, useState } from "react";
import { getTeamGuide } from "../data/teamGuides";
import { useLanguage } from "../i18n";
import type { Player, PlayerPosition, Team } from "../types/worldCup";
import { groupPositionLabel, qualityLabel, stageLabel } from "../utils/format";
import {
  displayClubName,
  displayCoachName,
  displayPlayerName,
  displayTeamName,
  playerSearchText,
} from "../utils/localizedNames";
import { getTopTeamPlayers } from "../utils/insights";
import { ExplanationCard } from "./ExplanationCard";
import { PlayerCard } from "./PlayerCard";
import { TeamStyleTags } from "./TeamStyleTags";
import { TeamFlag } from "./TeamFlag";

interface TeamModalProps {
  team: Team;
  players: Player[];
  onClose: () => void;
  onSelectPlayer: (player: Player) => void;
}

const positionLabels: Array<"all" | PlayerPosition> = ["all", "GK", "DF", "MF", "FW"];

export const TeamModal = ({ team, players, onClose, onSelectPlayer }: TeamModalProps) => {
  const { language, t } = useLanguage();
  const [position, setPosition] = useState<"all" | PlayerPosition>("all");
  const [club, setClub] = useState("all");
  const [query, setQuery] = useState("");
  const [sortByValue, setSortByValue] = useState(true);
  const teamName = displayTeamName(team, language);

  const topPlayerNames = useMemo(
    () =>
      [...players]
        .sort((a, b) => b.marketValueEurM - a.marketValueEurM)
        .slice(0, 3)
        .map((player) => displayPlayerName(player, language)),
    [language, players],
  );

  const guide = useMemo(
    () => getTeamGuide({ team, language, teamName, playerNames: topPlayerNames }),
    [language, team, teamName, topPlayerNames],
  );

  const clubs = useMemo(() => ["all", ...Array.from(new Set(players.map((player) => player.club))).sort()], [players]);

  const visiblePlayers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return players
      .filter((player) => position === "all" || player.position === position)
      .filter((player) => club === "all" || player.club === club)
      .filter((player) => playerSearchText(player).includes(normalizedQuery))
      .sort((a, b) => (sortByValue ? b.marketValueEurM - a.marketValueEurM : a.position.localeCompare(b.position)));
  }, [club, players, position, query, sortByValue]);

  const findPlayerByGuideName = (name: string) =>
    players.find((player) => {
      const names = [player.name, displayPlayerName(player, "en"), displayPlayerName(player, "zh")].map((value) =>
        value.toLowerCase(),
      );
      return names.includes(name.toLowerCase());
    });

  const totalValue = players.reduce((sum, player) => sum + player.marketValueEurM, 0);
  const keyPlayers = players.filter((player) => player.isKeyPlayer).length;
  const spotlightPlayers = getTopTeamPlayers(team.id, players);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <article className="glass-panel max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-lg p-5">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-5 light:border-slate-900/10 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <TeamFlag team={team} size="xl" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-3xl font-black text-white light:text-slate-950">{teamName}</h2>
                {team.isDarkHorse && (
                  <span className="rounded-md bg-orange-400/15 px-2 py-1 text-xs font-bold text-orange-200 light:text-orange-700">
                    {t("darkHorse")}
                  </span>
                )}
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 light:text-slate-700">
                {guide.beginnerIntro}
              </p>
              <div className="mt-3">
                <TeamStyleTags team={team} />
              </div>
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
              {displayCoachName(team.coach, language) || "TBD"} · {team.formation ?? "TBD"}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4 light:border-slate-900/10 light:bg-slate-50">
            <p className="text-xs uppercase text-slate-500">{t("squadSnapshot")}</p>
            <p className="mt-1 font-black text-white light:text-slate-950">
              €{totalValue.toFixed(0)}m · {keyPlayers} {t("corePlayers")}
            </p>
          </div>
        </div>

        <section className="mt-6 rounded-lg border border-trophy-500/20 bg-trophy-500/10 p-4">
          <div className="flex items-center gap-2">
            <Star className="fill-trophy-400 text-trophy-400" size={18} />
            <h3 className="text-lg font-black text-white light:text-slate-950">{t("beginnerGuide")}</h3>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-black text-trophy-200 light:text-trophy-800">{t("teamStyle")}</h4>
                <p className="mt-1 text-sm leading-6 text-slate-300 light:text-slate-700">{guide.playStyle}</p>
              </div>
              <div>
                <h4 className="text-sm font-black text-trophy-200 light:text-trophy-800">{t("playersToWatch")}</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {guide.playersToWatch.map((name) => {
                    const player = findPlayerByGuideName(name);

                    if (!player) {
                      return (
                        <span
                          className="rounded-md border border-white/10 bg-slate-950/35 px-2 py-1 text-xs font-bold text-slate-200 light:border-slate-900/10 light:bg-white light:text-slate-700"
                          key={name}
                        >
                          {name}
                        </span>
                      );
                    }

                    return (
                      <button
                        className="rounded-md border border-trophy-500/30 bg-slate-950/35 px-2 py-1 text-xs font-bold text-trophy-200 transition hover:border-trophy-400 hover:bg-trophy-500/20 light:bg-white light:text-trophy-800"
                        key={player.playerId}
                        onClick={() => onSelectPlayer(player)}
                        type="button"
                      >
                        {displayPlayerName(player, language)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="text-sm font-black text-emerald-300 light:text-emerald-700">{t("keyStrengths")}</h4>
                <ul className="mt-2 space-y-1 text-sm text-slate-300 light:text-slate-700">
                  {guide.keyStrengths.map((item) => (
                    <li className="flex gap-2" key={item}>
                      <span className="text-emerald-300">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-black text-orange-300 light:text-orange-700">{t("weaknesses")}</h4>
                <ul className="mt-2 space-y-1 text-sm text-slate-300 light:text-slate-700">
                  {guide.weaknesses.map((item) => (
                    <li className="flex gap-2" key={item}>
                      <span className="text-orange-300">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <h4 className="text-sm font-black text-trophy-200 light:text-trophy-800">{t("historicalNote")}</h4>
              <p className="mt-1 text-sm leading-6 text-slate-300 light:text-slate-700">{guide.historicalNote}</p>
            </div>
            <div>
              <h4 className="text-sm font-black text-trophy-200 light:text-trophy-800">{t("whyTheyMatter")}</h4>
              <p className="mt-1 text-sm leading-6 text-slate-300 light:text-slate-700">{guide.whyTheyMatter}</p>
            </div>
          </div>
        </section>

        <div className="mt-6">
          <ExplanationCard players={players} team={team} />
        </div>

        <section className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 light:border-slate-900/10 light:bg-slate-50">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-white light:text-slate-950">{t("keyPlayerTrioTitle")}</h3>
              <p className="text-sm text-slate-400 light:text-slate-600">{t("keyPlayerTrioDescription")}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {spotlightPlayers.map((player) => (
              <button
                className="rounded-lg border border-white/10 bg-slate-950/45 p-4 text-left transition hover:border-trophy-500 light:border-slate-900/10 light:bg-white"
                key={player.playerId}
                onClick={() => onSelectPlayer(player)}
                type="button"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{player.position}</p>
                <p className="mt-2 text-lg font-black text-white light:text-slate-950">
                  {displayPlayerName(player, language)}
                </p>
                <p className="mt-1 text-sm text-slate-400 light:text-slate-600">
                  {displayClubName(player.club, language)}
                </p>
                <p className="mt-3 text-sm font-bold text-trophy-300 light:text-trophy-700">{player.marketValue ?? "N/A"}</p>
              </button>
            ))}
          </div>
        </section>

        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-4 light:border-slate-900/10 light:bg-slate-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-white light:text-slate-950">{t("playerList")}</h3>
              <p className="text-xs text-slate-400 light:text-slate-600">
                {t("updated")} {team.lastUpdated} · {qualityLabel(team.dataQuality, t)}
              </p>
            </div>
            {team.sourceUrls[0] && (
              <a
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10 light:border-slate-900/10 light:text-slate-700"
                href={team.sourceUrls[0]}
                rel="noreferrer"
                target="_blank"
              >
                {t("dataSource")}
                <ExternalLink size={15} />
              </a>
            )}
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
                  {item === "all" ? t("allClubs") : displayClubName(item, language)}
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
