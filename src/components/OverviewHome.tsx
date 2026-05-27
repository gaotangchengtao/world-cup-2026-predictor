import { BarChart3, CalendarClock, Crown, Gauge, Sparkles, Star, Trophy } from "lucide-react";
import { groups as defaultGroups } from "../data/groups";
import { useLanguage } from "../i18n";
import type { BracketPredictionState, ExperienceMode, OverviewSection, Player, Team } from "../types/worldCup";
import { getChampionId } from "../utils/bracket";
import { qualityLabel, stageLabel } from "../utils/format";
import { getHardestGroup, summarizeDataQuality } from "../utils/insights";
import { displayClubName, displayPlayerName, displayTeamName } from "../utils/localizedNames";
import { overviewSectionMeta } from "./OverviewSectionNav";
import { PlayerAvatar } from "./PlayerAvatar";
import { PredictionSummary } from "./PredictionSummary";
import { SectionCard } from "./SectionCard";
import { TeamFlag } from "./TeamFlag";

interface OverviewHomeProps {
  bracketState: BracketPredictionState;
  experienceMode: ExperienceMode;
  onSelectPlayer: (player: Player) => void;
  onSelectTeam: (team: Team) => void;
  players: Player[];
  setActiveSection: (section: OverviewSection) => void;
  teams: Team[];
}

export const OverviewHome = ({
  bracketState,
  experienceMode,
  onSelectPlayer,
  onSelectTeam,
  players,
  setActiveSection,
  teams,
}: OverviewHomeProps) => {
  const { language, t } = useLanguage();
  const champion =
    teams.find((team) => team.id === getChampionId(bracketState)) ??
    teams.find((team) => team.predictedStage === "Champion");
  const strongestTeams = [...teams].sort((a, b) => a.strengthRank - b.strengthRank).slice(0, 5);
  const darkHorses = [...teams]
    .filter((team) => team.isDarkHorse)
    .sort((a, b) => a.strengthRank - b.strengthRank)
    .slice(0, 5);
  const topValuePlayers = [...players].sort((a, b) => b.marketValueEurM - a.marketValueEurM).slice(0, 5);
  const mustWatchPlayers = [...players]
    .sort((a, b) => {
      if (Number(b.isKeyPlayer) !== Number(a.isKeyPlayer)) return Number(b.isKeyPlayer) - Number(a.isKeyPlayer);
      return b.marketValueEurM - a.marketValueEurM;
    })
    .slice(0, 5);
  const dashboardPlayers = experienceMode === "beginner" ? mustWatchPlayers : topValuePlayers;
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const hardestGroup = getHardestGroup(defaultGroups, teams);
  const updatedRows = [...teams.map((team) => team.lastUpdated), ...players.map((player) => player.lastUpdated ?? "")]
    .filter(Boolean)
    .sort();
  const dataUpdated = updatedRows[updatedRows.length - 1];
  const qualityRows = summarizeDataQuality(teams, players).filter((row) => row.count > 0);

  const sectionTags: Record<OverviewSection, string[]> = {
    home: [t("championPrediction"), t("titleContenders"), t("darkHorseTeams")],
    groups: [t("groupStage"), t("strengthRank"), t("regionTitle")],
    knockout: [t("stageRoundOf32"), t("champion"), t("winProbability")],
    players: [t("marketValue"), t("teamCompare"), t("photoPanelTitle")],
    beginner: [t("watchGuideTitle"), t("glossaryTitle"), t("teamStyle")],
    data: [t("dataQuality"), t("jsonImportExport"), t("posterTitle")],
  };

  return (
    <section className="space-y-5">
      <PredictionSummary teams={teams} players={players} bracketState={bracketState} />

      <div className="grid gap-4 xl:grid-cols-[1.05fr_1fr_1fr]">
        <article className="glass-panel rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-trophy-300 light:text-trophy-700">
                {t("overviewChampionCard")}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300 light:text-slate-700">
                {t("overviewChampionCardDesc")}
              </p>
            </div>
            <Crown className="text-trophy-300" size={24} />
          </div>
          {champion && (
            <button
              className="mt-4 flex w-full items-center gap-3 rounded-lg border border-trophy-500/30 bg-trophy-500/10 p-4 text-left transition hover:border-trophy-500 light:bg-trophy-50"
              onClick={() => onSelectTeam(champion)}
              type="button"
            >
              <TeamFlag team={champion} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-2xl font-black text-white light:text-slate-950">
                  {displayTeamName(champion, language)}
                </p>
                <p className="mt-1 text-sm text-slate-300 light:text-slate-700">
                  #{champion.strengthRank} · {stageLabel(champion.predictedStage, t)} · {t("score")}{" "}
                  {champion.strengthScore}
                </p>
              </div>
              <Trophy className="text-trophy-300" size={22} />
            </button>
          )}
        </article>

        <article className="glass-panel rounded-lg p-4">
          <h2 className="text-lg font-black text-white light:text-slate-950">{t("overviewStrongTeams")}</h2>
          <div className="mt-4 grid gap-2">
            {strongestTeams.map((team) => (
              <button
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-left transition hover:border-trophy-500 light:border-slate-900/10 light:bg-white"
                key={team.id}
                onClick={() => onSelectTeam(team)}
                type="button"
              >
                <span className="w-8 text-sm font-black text-trophy-300">#{team.strengthRank}</span>
                <TeamFlag team={team} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-white light:text-slate-950">
                  {displayTeamName(team, language)}
                </span>
                {experienceMode === "expert" && (
                  <span className="text-xs font-black text-slate-300 light:text-slate-600">{team.strengthScore}</span>
                )}
              </button>
            ))}
          </div>
        </article>

        <article className="glass-panel rounded-lg p-4">
          <h2 className="text-lg font-black text-white light:text-slate-950">{t("overviewMustWatchPlayers")}</h2>
          <div className="mt-4 grid gap-2">
            {dashboardPlayers.map((player, index) => {
              const team = teamById.get(player.teamId);

              return (
                <button
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-left transition hover:border-trophy-500 light:border-slate-900/10 light:bg-white"
                  key={player.playerId}
                  onClick={() => onSelectPlayer(player)}
                  type="button"
                >
                  <span className="w-7 text-sm font-black text-trophy-300">#{index + 1}</span>
                  <PlayerAvatar
                    alt={displayPlayerName(player, language)}
                    className="h-9 w-9 rounded-full object-cover"
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
                  </div>
                  {experienceMode === "expert" && (
                    <span className="text-sm font-black text-trophy-300 light:text-trophy-700">
                      {player.marketValue ?? "N/A"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="glass-panel rounded-lg p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-white light:text-slate-950">{t("overviewDarkHorsesTop")}</h2>
            <Sparkles className="text-orange-300" size={20} />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {darkHorses.map((team) => (
              <button
                className="rounded-lg border border-white/10 bg-white/5 p-3 text-left transition hover:border-orange-300 light:border-slate-900/10 light:bg-white"
                key={team.id}
                onClick={() => onSelectTeam(team)}
                type="button"
              >
                <div className="flex items-center gap-2">
                  <TeamFlag team={team} size="sm" />
                  <p className="min-w-0 flex-1 truncate text-sm font-black text-white light:text-slate-950">
                    {displayTeamName(team, language)}
                  </p>
                  <Star className="text-orange-300" size={14} />
                </div>
                <p className="mt-2 text-xs text-slate-400 light:text-slate-600">
                  #{team.strengthRank} · {stageLabel(team.predictedStage, t)}
                </p>
              </button>
            ))}
          </div>
        </article>

        <article className="glass-panel rounded-lg p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-white light:text-slate-950">{t("overviewHardestGroup")}</h2>
            <Gauge className="text-sky-300" size={20} />
          </div>
          {hardestGroup && (
            <div className="mt-4 rounded-lg border border-sky-400/20 bg-sky-500/10 p-4">
              <p className="text-4xl font-black text-white light:text-slate-950">
                {t("group")} {hardestGroup.group}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300 light:text-slate-700">
                {t("overviewHardestGroupDesc")}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase text-slate-500">{t("strengthRank")}</p>
                  <p className="text-xl font-black text-sky-300">{hardestGroup.averageStrengthRank.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">{t("strengthScore")}</p>
                  <p className="text-xl font-black text-sky-300">{hardestGroup.averageStrengthScore.toFixed(1)}</p>
                </div>
              </div>
            </div>
          )}
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="glass-panel rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="text-trophy-300" size={20} />
            <h2 className="text-lg font-black text-white light:text-slate-950">{t("overviewDataUpdated")}</h2>
          </div>
          <p className="mt-3 text-3xl font-black text-white light:text-slate-950">{dataUpdated ?? "N/A"}</p>
          <p className="mt-2 text-sm leading-6 text-slate-300 light:text-slate-700">{t("finalSquadUpdateNote")}</p>
        </article>
        <article className="glass-panel rounded-lg p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-emerald-300" size={20} />
            <h2 className="text-lg font-black text-white light:text-slate-950">{t("overviewTrustSummary")}</h2>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {qualityRows.map((row) => (
              <span
                className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-300 light:border-slate-900/10 light:bg-slate-50 light:text-slate-700"
                key={row.key}
              >
                {qualityLabel(row.key, t)}: {row.count}
              </span>
            ))}
          </div>
        </article>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-white light:text-slate-950">{t("overviewSectionCards")}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {overviewSectionMeta.map((section) => {
            const Icon = section.icon;

            return (
              <SectionCard
                description={t(section.descriptionKey)}
                icon={<Icon size={22} />}
                key={section.id}
                onSelect={setActiveSection}
                section={section.id}
                tags={sectionTags[section.id]}
                title={t(section.titleKey)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};
