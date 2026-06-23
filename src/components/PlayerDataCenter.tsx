import {
  Activity,
  ChartNoAxesColumnIncreasing,
  CircleAlert,
  Crosshair,
  Gauge,
  Goal,
  Hand,
  Search,
  ShieldCheck,
  Trophy,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage, type TranslationKey } from "../i18n";
import statsJson from "../data/playerTournamentStats.json";
import type {
  Player,
  PlayerPosition,
  PlayerTournamentStatsSnapshot,
  Team,
} from "../types/worldCup";
import {
  displayClubName,
  displayPlayerName,
  displayTeamName,
  playerSearchText,
} from "../utils/localizedNames";
import { playerPositionLabel } from "../utils/format";
import { PlayerAvatar } from "./PlayerAvatar";
import { TeamFlag } from "./TeamFlag";

type CategoryId =
  | "overview"
  | "attack"
  | "distribution"
  | "defending"
  | "discipline"
  | "goalkeeping"
  | "physical"
  | "values";

interface Metric {
  decimals?: number;
  key: string;
  labelKey: TranslationKey;
  scale?: number;
  source?: "market";
  suffix?: string;
}

interface Category {
  icon: typeof Trophy;
  id: CategoryId;
  labelKey: TranslationKey;
  metrics: Metric[];
}

const categories: Category[] = [
  {
    id: "overview",
    labelKey: "playerDataOverview",
    icon: Trophy,
    metrics: [
      { key: "goals", labelKey: "statGoals" },
      { key: "assists", labelKey: "statAssists" },
      { key: "total_competition_minutes_played", labelKey: "statMinutes" },
      { key: "marketValue", labelKey: "statMarketValue", source: "market", suffix: "m", decimals: 2 },
    ],
  },
  {
    id: "attack",
    labelKey: "playerDataAttack",
    icon: Crosshair,
    metrics: [
      { key: "goals", labelKey: "statGoals" },
      { key: "assists", labelKey: "statAssists" },
      { key: "attempt_at_goal", labelKey: "statShots" },
      { key: "attempt_at_goal_on_target", labelKey: "statShotsOnTarget" },
      { key: "xg", labelKey: "statExpectedGoals", decimals: 2 },
    ],
  },
  {
    id: "distribution",
    labelKey: "playerDataDistribution",
    icon: ChartNoAxesColumnIncreasing,
    metrics: [
      { key: "passes", labelKey: "statPasses" },
      { key: "passing_accuracy_rate", labelKey: "statPassAccuracy", suffix: "%", decimals: 1 },
      { key: "crosses", labelKey: "statCrosses" },
      { key: "linebreaks_attempted_defensive_line", labelKey: "statLineBreaks" },
    ],
  },
  {
    id: "defending",
    labelKey: "playerDataDefending",
    icon: ShieldCheck,
    metrics: [
      { key: "forced_turnovers", labelKey: "statInterceptions" },
      { key: "defensive_pressures_applied", labelKey: "statDefensivePressures" },
      { key: "direct_defensive_pressures_applied", labelKey: "statDirectPressures" },
    ],
  },
  {
    id: "discipline",
    labelKey: "playerDataDiscipline",
    icon: CircleAlert,
    metrics: [
      { key: "yellow_cards", labelKey: "statYellowCards" },
      { key: "red_cards", labelKey: "statRedCards" },
      { key: "fouls_against", labelKey: "statFouls" },
      { key: "offsides", labelKey: "statOffsides" },
    ],
  },
  {
    id: "goalkeeping",
    labelKey: "playerDataGoalkeeping",
    icon: Hand,
    metrics: [
      { key: "goalkeeper_saves", labelKey: "statSaves" },
      {
        key: "goalkeeper_defensive_actions_inside_penalty_area",
        labelKey: "statGoalkeeperActions",
      },
    ],
  },
  {
    id: "physical",
    labelKey: "playerDataPhysical",
    icon: Gauge,
    metrics: [
      { key: "sprints", labelKey: "statSprints" },
      { key: "speed_runs", labelKey: "statHighSpeedRuns" },
      { key: "total_distance", labelKey: "statTotalDistance", scale: 1000, suffix: " km", decimals: 1 },
      { key: "avg_speed", labelKey: "statAverageSpeed", suffix: " km/h", decimals: 1 },
    ],
  },
  {
    id: "values",
    labelKey: "playerDataValues",
    icon: WalletCards,
    metrics: [
      { key: "marketValue", labelKey: "statMarketValue", source: "market", suffix: "m", decimals: 2 },
      { key: "internationalCaps", labelKey: "internationalCaps" },
      { key: "internationalGoals", labelKey: "internationalGoals" },
    ],
  },
];

interface PlayerDataCenterProps {
  onSelectPlayer: (player: Player) => void;
  players: Player[];
  teams: Team[];
}

const statsSnapshot = statsJson as PlayerTournamentStatsSnapshot;

export const PlayerDataCenter = ({
  onSelectPlayer,
  players,
  teams,
}: PlayerDataCenterProps) => {
  const { language, t } = useLanguage();
  const [categoryId, setCategoryId] = useState<CategoryId>("overview");
  const [metricKey, setMetricKey] = useState("goals");
  const [query, setQuery] = useState("");
  const [teamId, setTeamId] = useState("all");
  const [position, setPosition] = useState<"all" | PlayerPosition>("all");
  const [showAllMobile, setShowAllMobile] = useState(false);

  const category = categories.find((item) => item.id === categoryId) ?? categories[0];
  const metric = category.metrics.find((item) => item.key === metricKey) ?? category.metrics[0];
  const teamById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);
  const statsByPlayerId = useMemo(
    () =>
      new Map(
        statsSnapshot.players.map((row) => [
          row.playerId,
          Object.fromEntries(
            statsSnapshot.metricKeys.map((key, index) => [key, row.values[index] ?? null]),
          ) as Record<string, number | string | null>,
        ]),
      ),
    [],
  );

  useEffect(() => {
    setMetricKey(category.metrics[0].key);
    setShowAllMobile(false);
  }, [category.id]);

  useEffect(() => {
    setShowAllMobile(false);
  }, [metric.key]);

  const valueFor = (player: Player) => {
    if (metric.source === "market") return player.marketValueEurM;
    if (metric.key === "internationalCaps") return player.internationalCaps ?? 0;
    if (metric.key === "internationalGoals") return player.internationalGoals ?? 0;
    const rawValue = Number(statsByPlayerId.get(player.playerId)?.[metric.key] ?? 0);
    return rawValue / (metric.scale ?? 1);
  };

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return players
      .filter((player) => player.availabilityStatus !== "not-selected")
      .filter((player) => teamId === "all" || player.teamId === teamId)
      .filter((player) => position === "all" || player.position === position)
      .filter((player) => !normalizedQuery || playerSearchText(player).includes(normalizedQuery))
      .map((player) => ({ player, value: valueFor(player) }))
      .filter((row) => row.value > 0)
      .sort((left, right) => right.value - left.value || left.player.name.localeCompare(right.player.name))
      .slice(0, 50);
  }, [metric.key, metric.source, players, position, query, teamId]);

  const formatValue = (value: number) => {
    const formatted = new Intl.NumberFormat(language === "zh" ? "zh-CN" : "en-US", {
      maximumFractionDigits: metric.decimals ?? (Number.isInteger(value) ? 0 : 2),
      minimumFractionDigits: metric.decimals ?? 0,
    }).format(value);
    if (metric.source === "market") return `€${formatted}${metric.suffix ?? ""}`;
    return `${formatted}${metric.suffix ?? ""}`;
  };

  const goalsIndex = statsSnapshot.metricKeys.indexOf("goals");
  const totalGoals = statsSnapshot.players.reduce(
    (sum, row) => sum + Number(row.values[goalsIndex] ?? 0),
    0,
  );

  return (
    <section className="space-y-3 sm:space-y-4">
      <header className="host-accent rounded-lg border border-white/10 bg-[#04142f]/80 p-4 light:border-slate-900/10 light:bg-white sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-trophy-300 light:text-trophy-700">
              {t("currentTournamentStats")}
            </p>
            <h2 className="mt-1 text-2xl font-black text-white light:text-slate-950 sm:text-3xl">
              {t("playerDataTitle")}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 light:text-slate-600">
              {t("playerDataDescription")}
            </p>
          </div>
          <a
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white light:text-slate-600 light:hover:text-slate-950"
            href={statsSnapshot.sourceUrl}
            rel="noreferrer"
            target="_blank"
          >
            <Activity size={15} />
            {t("officialFifaData")}
          </a>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded-md border border-white/10 bg-white/5 p-3 light:border-slate-900/10 light:bg-slate-50">
            <p className="text-2xl font-black text-white light:text-slate-950">{players.length}</p>
            <p className="mt-1 text-xs text-slate-400 light:text-slate-600">{t("squadPlayersCount")}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 p-3 light:border-slate-900/10 light:bg-slate-50">
            <p className="text-2xl font-black text-trophy-300 light:text-trophy-700">{totalGoals}</p>
            <p className="mt-1 text-xs text-slate-400 light:text-slate-600">{t("tournamentGoals")}</p>
          </div>
          <div className="col-span-2 rounded-md border border-white/10 bg-white/5 p-3 light:border-slate-900/10 light:bg-slate-50 sm:col-span-1">
            <p className="truncate text-sm font-black text-white light:text-slate-950">
              {new Date(statsSnapshot.updatedAt).toLocaleString(language === "zh" ? "zh-CN" : "en-US")}
            </p>
            <p className="mt-1 text-xs text-slate-400 light:text-slate-600">{t("statsUpdatedAt")}</p>
          </div>
        </div>
      </header>

      <div className="mobile-scrollbar-none overflow-x-auto">
        <div className="flex min-w-max gap-1.5 rounded-lg border border-white/10 bg-[#04142f]/70 p-1.5 light:border-slate-900/10 light:bg-white">
          {categories.map((item) => {
            const Icon = item.icon;
            const active = item.id === categoryId;
            return (
              <button
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-black transition sm:text-sm ${
                  active
                    ? "bg-host-blue text-white shadow-lg"
                    : "text-slate-300 hover:bg-white/10 light:text-slate-600"
                }`}
                key={item.id}
                onClick={() => setCategoryId(item.id)}
                type="button"
              >
                <Icon size={15} />
                {t(item.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="space-y-3 rounded-lg border border-white/10 bg-[#06152d]/80 p-3 light:border-slate-900/10 light:bg-white">
          <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-1">
            {category.metrics.map((item) => (
              <button
                className={`rounded-md px-3 py-2 text-left text-xs font-bold transition sm:text-sm ${
                  item.key === metric.key
                    ? "bg-host-green text-white"
                    : "bg-white/5 text-slate-300 hover:bg-white/10 light:bg-slate-50 light:text-slate-700"
                }`}
                key={item.key}
                onClick={() => setMetricKey(item.key)}
                type="button"
              >
                {t(item.labelKey)}
              </button>
            ))}
          </div>

          <label className="relative block">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={15} />
            <input
              className="w-full rounded-md border border-white/10 bg-slate-950/50 py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-host-blue light:border-slate-900/10 light:bg-slate-50 light:text-slate-950"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlayers")}
              value={query}
            />
          </label>

          <select
            aria-label={t("filterByTeam")}
            className="w-full rounded-md border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-white light:border-slate-900/10 light:bg-slate-50 light:text-slate-950"
            onChange={(event) => setTeamId(event.target.value)}
            value={teamId}
          >
            <option value="all">{t("allTeams")}</option>
            {[...teams]
              .sort((left, right) =>
                displayTeamName(left, language).localeCompare(displayTeamName(right, language)),
              )
              .map((team) => (
                <option key={team.id} value={team.id}>
                  {displayTeamName(team, language)}
                </option>
              ))}
          </select>

          <div className="grid grid-cols-5 gap-1">
            {(["all", "GK", "DF", "MF", "FW"] as const).map((item) => (
              <button
                className={`rounded px-1 py-1.5 text-[10px] font-black ${
                  position === item
                    ? "bg-host-maple text-white"
                    : "bg-white/5 text-slate-400 light:bg-slate-100 light:text-slate-600"
                }`}
                key={item}
                onClick={() => setPosition(item)}
                type="button"
              >
                {item === "all" ? t("allPositions") : playerPositionLabel(item, t)}
              </button>
            ))}
          </div>
        </aside>

        <div className="min-w-0 space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {rows.slice(0, 3).map(({ player, value }, index) => {
              const team = teamById.get(player.teamId);
              return (
                <button
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition hover:-translate-y-0.5 ${
                    index === 0
                      ? "border-trophy-400/50 bg-trophy-500/10"
                      : "border-white/10 bg-white/5 light:border-slate-900/10 light:bg-white"
                  }`}
                  key={player.playerId}
                  onClick={() => onSelectPlayer(player)}
                  type="button"
                >
                  <span className="text-xl font-black text-trophy-300">#{index + 1}</span>
                  <PlayerAvatar
                    alt={displayPlayerName(player, language)}
                    className="h-12 w-12 shrink-0 rounded-full border border-white/15 object-cover"
                    player={player}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-white light:text-slate-950">
                      {displayPlayerName(player, language)}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-400 light:text-slate-600">
                      <TeamFlag team={team} size="sm" />
                      {displayTeamName(team, language)}
                    </span>
                  </span>
                  <span className="shrink-0 text-lg font-black text-trophy-300 light:text-trophy-700">
                    {formatValue(value)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-lg border border-white/10 bg-[#06152d]/80 light:border-slate-900/10 light:bg-white">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-3 light:border-slate-900/10 sm:px-4">
              <div>
                <p className="text-xs font-bold text-slate-400 light:text-slate-600">
                  {t(category.labelKey)}
                </p>
                <h3 className="text-lg font-black text-white light:text-slate-950">{t(metric.labelKey)}</h3>
              </div>
              <Goal className="text-trophy-300" size={22} />
            </div>

            {rows.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">{t("noStatsAvailable")}</p>
            ) : (
              <div className="divide-y divide-white/5 light:divide-slate-900/5">
                {rows.slice(0, 20).map(({ player, value }, index) => {
                  const team = teamById.get(player.teamId);
                  return (
                    <button
                      className={`${index >= 10 && !showAllMobile ? "hidden sm:grid" : "grid"} w-full grid-cols-[28px_40px_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2.5 text-left transition hover:bg-white/5 light:hover:bg-slate-50 sm:grid-cols-[36px_44px_minmax(0,1fr)_150px_90px] sm:gap-3 sm:px-4`}
                      key={player.playerId}
                      onClick={() => onSelectPlayer(player)}
                      type="button"
                    >
                      <span className="text-center text-xs font-black text-slate-500">#{index + 1}</span>
                      <PlayerAvatar
                        alt={displayPlayerName(player, language)}
                        className="h-9 w-9 rounded-full object-cover sm:h-10 sm:w-10"
                        player={player}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-white light:text-slate-950">
                          {displayPlayerName(player, language)}
                        </span>
                        <span className="block truncate text-[11px] text-slate-500">
                          {displayClubName(player.club, language, player.localizedClubZh)} ·{" "}
                          {playerPositionLabel(player.position, t)}
                        </span>
                      </span>
                      <span className="hidden min-w-0 items-center gap-2 truncate text-xs text-slate-400 sm:flex">
                        <TeamFlag team={team} size="sm" />
                        {displayTeamName(team, language)}
                      </span>
                      <span className="text-right text-sm font-black text-trophy-300 light:text-trophy-700 sm:text-base">
                        {formatValue(value)}
                      </span>
                    </button>
                  );
                })}
                {rows.length > 10 && (
                  <button
                    className="w-full px-4 py-3 text-center text-xs font-black text-trophy-300 sm:hidden"
                    onClick={() => setShowAllMobile((current) => !current)}
                    type="button"
                  >
                    {showAllMobile ? t("collapseLeaderboard") : t("showFullLeaderboard")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
