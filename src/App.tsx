import { lazy, Suspense, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Header } from "./components/Header";
import { OverviewHome } from "./components/OverviewHome";
import { OverviewSectionNav, overviewSectionMeta } from "./components/OverviewSectionNav";
import { PredictionSummary } from "./components/PredictionSummary";
import { groups } from "./data/groups";
import { players as defaultPlayers } from "./data/players";
import { teams as defaultTeams } from "./data/teams";
import { useLanguage } from "./i18n";
import type { BracketPredictionState, ExperienceMode, FilterState, OverviewSection, Player, RuntimeData, Team } from "./types/worldCup";
import { completeBracketState, createRecommendedBracketState } from "./utils/bracket";
import { stageOrder } from "./utils/format";
import { teamSearchText } from "./utils/localizedNames";
import { getRecommendedWinnerId } from "./utils/modelPredictions";
import { readJson, storageKeys, writeJson } from "./utils/storage";

const BeginnerIntroPanel = lazy(() =>
  import("./components/BeginnerIntroPanel").then((module) => ({ default: module.BeginnerIntroPanel })),
);
const BeginnerPathPanel = lazy(() =>
  import("./components/BeginnerPathPanel").then((module) => ({ default: module.BeginnerPathPanel })),
);
const BracketView = lazy(() => import("./components/BracketView").then((module) => ({ default: module.BracketView })));
const DataImportExport = lazy(() =>
  import("./components/DataImportExport").then((module) => ({ default: module.DataImportExport })),
);
const DataQualityPanel = lazy(() =>
  import("./components/DataQualityPanel").then((module) => ({ default: module.DataQualityPanel })),
);
const FilterBar = lazy(() => import("./components/FilterBar").then((module) => ({ default: module.FilterBar })));
const GlossaryPanel = lazy(() =>
  import("./components/GlossaryPanel").then((module) => ({ default: module.GlossaryPanel })),
);
const GroupGrid = lazy(() => import("./components/GroupGrid").then((module) => ({ default: module.GroupGrid })));
const GroupStagePredictor = lazy(() =>
  import("./components/GroupStagePredictor").then((module) => ({ default: module.GroupStagePredictor })),
);
const MatchWatchingGuide = lazy(() =>
  import("./components/MatchWatchingGuide").then((module) => ({ default: module.MatchWatchingGuide })),
);
const ModelDataPanel = lazy(() =>
  import("./components/ModelDataPanel").then((module) => ({ default: module.ModelDataPanel })),
);
const OffFieldStoriesPanel = lazy(() =>
  import("./components/OffFieldStoriesPanel").then((module) => ({ default: module.OffFieldStoriesPanel })),
);
const PhotoAuditPanel = lazy(() =>
  import("./components/PhotoAuditPanel").then((module) => ({ default: module.PhotoAuditPanel })),
);
const PlayerDataCenter = lazy(() =>
  import("./components/PlayerDataCenter").then((module) => ({ default: module.PlayerDataCenter })),
);
const PlayerModal = lazy(() => import("./components/PlayerModal").then((module) => ({ default: module.PlayerModal })));
const PosterExportPanel = lazy(() =>
  import("./components/PosterExportPanel").then((module) => ({ default: module.PosterExportPanel })),
);
const RegionOverview = lazy(() =>
  import("./components/RegionOverview").then((module) => ({ default: module.RegionOverview })),
);
const ScheduleSnapshotPanel = lazy(() =>
  import("./components/ScheduleSnapshotPanel").then((module) => ({ default: module.ScheduleSnapshotPanel })),
);
const TeamCompare = lazy(() => import("./components/TeamCompare").then((module) => ({ default: module.TeamCompare })));
const TeamModal = lazy(() => import("./components/TeamModal").then((module) => ({ default: module.TeamModal })));
const WatchGuidePanel = lazy(() =>
  import("./components/WatchGuidePanel").then((module) => ({ default: module.WatchGuidePanel })),
);

const defaultFilters: FilterState = {
  query: "",
  group: "all",
  stage: "all",
  onlyContenders: false,
  onlyDarkHorses: false,
  sortBy: "strengthRank",
  groupSortBy: "strengthRank",
};

const defaultRuntimeData: RuntimeData = {
  teams: defaultTeams,
  players: defaultPlayers,
};

const CURRENT_PREDICTION_VERSION = "2026-07-08-full-quarterfinal-model-v1";

const contenderStages = new Set(["Champion", "Final", "Semi-final", "Quarter-final"]);
const overviewSectionIds: OverviewSection[] = ["home", "groups", "knockout", "players", "beginner", "stories", "data"];

const mergeDefaultRuntimeData = (data: RuntimeData, refreshPredictions = false): RuntimeData => {
  const defaultTeamById = new Map(defaultTeams.map((team) => [team.id, team]));
  const mergedTeams = data.teams.map((team) => {
    const current = defaultTeamById.get(team.id);
    if (!current || !refreshPredictions) return team;

    return {
      ...team,
      group: current.group,
      strengthRank: current.strengthRank,
      strengthScore: current.strengthScore,
      squadValue: current.squadValue,
      squadValueEurM: current.squadValueEurM,
      predictedGroupPosition: current.predictedGroupPosition,
      predictedStage: current.predictedStage,
      lastUpdated: current.lastUpdated,
      sourceUrls: current.sourceUrls,
    };
  });
  const previousByFifaId = new Map(
    data.players.filter((player) => player.fifaId).map((player) => [player.fifaId, player]),
  );
  const playerIdentity = (player: Player) =>
    `${player.teamId}:${player.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")}`;
  const previousByIdentity = new Map(data.players.map((player) => [playerIdentity(player), player]));
  const mergedPlayers = refreshPredictions
    ? defaultPlayers.map((current) => {
        const previous =
          (current.fifaId ? previousByFifaId.get(current.fifaId) : undefined) ??
          previousByIdentity.get(playerIdentity(current));
        if (!previous) return current;
        const preserveManualPhoto = previous.photoSource === "manual";
        const preserveManualValue = previous.dataQuality === "manual" && previous.marketValueEurM > 0;

        return {
          ...current,
          marketValue: preserveManualValue ? previous.marketValue : current.marketValue,
          marketValueEurM: preserveManualValue ? previous.marketValueEurM : current.marketValueEurM,
          marketValueLastUpdated: preserveManualValue
            ? previous.marketValueLastUpdated
            : current.marketValueLastUpdated,
          marketValueSourceUrl: preserveManualValue
            ? previous.marketValueSourceUrl
            : current.marketValueSourceUrl,
          marketValueStatus: preserveManualValue ? previous.marketValueStatus : current.marketValueStatus,
          photoUrl: preserveManualPhoto ? previous.photoUrl : current.photoUrl,
          photoSource: preserveManualPhoto ? previous.photoSource : current.photoSource,
          photoCredit: preserveManualPhoto ? previous.photoCredit : current.photoCredit,
          photoLastUpdated: preserveManualPhoto
            ? previous.photoLastUpdated
            : current.photoLastUpdated,
        };
      })
    : data.players;
  const teamIds = new Set(mergedTeams.map((team) => team.id));
  const playerIds = new Set(mergedPlayers.map((player) => player.playerId));

  return {
    ...data,
    teams: [...mergedTeams, ...defaultTeams.filter((team) => !teamIds.has(team.id))],
    players: [...mergedPlayers, ...defaultPlayers.filter((player) => !playerIds.has(player.playerId))],
  };
};

const createCurrentRecommendedBracket = (runtimeData: RuntimeData) =>
  createRecommendedBracketState(runtimeData.teams, (slotA, slotB, availableTeams) => {
    const teamA = availableTeams.find((team) => team.id === slotA);
    const teamB = availableTeams.find((team) => team.id === slotB);
    return getRecommendedWinnerId(teamA, teamB, runtimeData.players);
  });

const readOverviewSection = () => {
  const saved = readJson(storageKeys.overviewSection, "home" as OverviewSection);
  return overviewSectionIds.includes(saved) ? saved : "home";
};

export default function App() {
  const { t } = useLanguage();
  const heroBackgroundUrl = new URL("assets/hero/stadium-night.webp", window.location.href).href;
  const heroPanelStyle = {
    "--hero-bg-image": `url("${heroBackgroundUrl}")`,
  } as CSSProperties;
  const [mode, setMode] = useState<"overview" | "predictor">(() =>
    readJson(storageKeys.mode, "overview" as "overview" | "predictor"),
  );
  const [theme, setTheme] = useState<"dark" | "light">(() => readJson(storageKeys.theme, "dark" as "dark" | "light"));
  const [experienceMode, setExperienceMode] = useState<ExperienceMode>(() =>
    readJson(storageKeys.experienceMode, "beginner" as ExperienceMode),
  );
  const [activeOverviewSection, setActiveOverviewSection] = useState<OverviewSection>(readOverviewSection);
  const [runtimeData, setRuntimeData] = useState<RuntimeData>(() => {
    const refreshPredictions =
      readJson<string>(storageKeys.runtimeDataVersion, "") !== CURRENT_PREDICTION_VERSION;
    return mergeDefaultRuntimeData(
      readJson(storageKeys.runtimeData, defaultRuntimeData),
      refreshPredictions,
    );
  });
  const [bracketState, setBracketState] = useState<BracketPredictionState>(() => {
    const recommended = createCurrentRecommendedBracket(runtimeData);
    const refreshBracket =
      readJson<string>(storageKeys.bracketPredictionVersion, "") !== CURRENT_PREDICTION_VERSION;
    return completeBracketState(
      refreshBracket ? recommended : readJson(storageKeys.bracketPredictions, recommended),
      runtimeData.teams,
    );
  });
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  useEffect(() => {
    writeJson(storageKeys.mode, mode);
  }, [mode]);

  useEffect(() => {
    writeJson(storageKeys.theme, theme);
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    writeJson(storageKeys.experienceMode, experienceMode);
  }, [experienceMode]);

  useEffect(() => {
    writeJson(storageKeys.overviewSection, activeOverviewSection);
  }, [activeOverviewSection]);

  useEffect(() => {
    writeJson(storageKeys.bracketPredictions, bracketState);
    writeJson(storageKeys.bracketPredictionVersion, CURRENT_PREDICTION_VERSION);
  }, [bracketState]);

  useEffect(() => {
    writeJson(storageKeys.runtimeData, runtimeData);
    writeJson(storageKeys.runtimeDataVersion, CURRENT_PREDICTION_VERSION);
  }, [runtimeData]);

  useEffect(() => {
    setBracketState((current) => completeBracketState(current, runtimeData.teams));
  }, [runtimeData.teams]);

  const visibleTeams = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    return runtimeData.teams
      .filter((team) => teamSearchText(team).includes(query))
      .filter((team) => filters.group === "all" || team.group === filters.group)
      .filter((team) => filters.stage === "all" || team.predictedStage === filters.stage)
      .filter((team) => !filters.onlyContenders || contenderStages.has(team.predictedStage))
      .filter((team) => !filters.onlyDarkHorses || team.isDarkHorse)
      .sort((a, b) => {
        if (filters.sortBy === "squadValue") return (b.squadValueEurM ?? 0) - (a.squadValueEurM ?? 0);
        if (filters.sortBy === "group") return a.group.localeCompare(b.group) || a.strengthRank - b.strengthRank;
        if (filters.sortBy === "predictedStage") {
          return stageOrder[a.predictedStage] - stageOrder[b.predictedStage] || a.strengthRank - b.strengthRank;
        }
        return a.strengthRank - b.strengthRank;
      });
  }, [filters, runtimeData.teams]);

  const selectedTeamPlayers = selectedTeam
    ? runtimeData.players.filter((player) => player.teamId === selectedTeam.id)
    : [];
  const selectedPlayerTeam = selectedPlayer
    ? runtimeData.teams.find((team) => team.id === selectedPlayer.teamId)
    : undefined;
  const activeOverviewMeta =
    overviewSectionMeta.find((section) => section.id === activeOverviewSection) ?? overviewSectionMeta[0];
  const importRuntimeData = (data: RuntimeData) => setRuntimeData(mergeDefaultRuntimeData(data));

  return (
    <div className={`${theme} stadium-bg min-h-screen text-slate-100 light:text-slate-900`}>
      <Header
        experienceMode={experienceMode}
        mode={mode}
        setExperienceMode={setExperienceMode}
        setMode={setMode}
        theme={theme}
        toggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
      />

      <main className="mx-auto max-w-[1440px] space-y-3 px-3 py-3 sm:space-y-5 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        {mode === "overview" && (
        <section
          className={`glass-panel hero-panel host-accent rounded-lg p-3.5 sm:p-5 lg:p-6 ${
            activeOverviewSection === "home" ? "" : "hidden sm:block"
          }`}
          style={heroPanelStyle}
        >
          <div className="grid gap-3 lg:grid-cols-[1fr_320px] lg:items-end">
          <div className="max-w-4xl">
            <p className="text-[11px] font-bold uppercase text-trophy-300 light:text-trophy-700 sm:text-sm">
              {t("heroKicker")}
            </p>
            <h2 className="mt-1.5 text-xl font-black leading-tight text-white light:text-slate-950 sm:mt-2 sm:text-4xl">
              {t("heroTitle")}
            </h2>
            <p className="mt-2 line-clamp-2 max-w-3xl text-xs leading-5 text-slate-300 light:text-slate-700 sm:mt-3 sm:text-base sm:leading-6">
              {experienceMode === "beginner" ? t("beginnerHeroDescription") : t("expertHeroDescription")}
            </p>
          </div>
          <div className="hidden rounded-lg border border-white/10 bg-slate-950/40 p-4 light:border-slate-900/10 light:bg-white/70 sm:block">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 light:text-slate-500">
              {t("currentExperience")}
            </p>
            <h3 className="mt-2 text-xl font-black text-white light:text-slate-950">
              {experienceMode === "beginner" ? t("beginnerMode") : t("expertMode")}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-300 light:text-slate-700">
              {experienceMode === "beginner" ? t("beginnerModePromise") : t("expertModePromise")}
            </p>
          </div>
          </div>
        </section>
        )}

        <Suspense fallback={<LazyPanelFallback />}>
        {mode === "overview" ? (
          <>
            <OverviewSectionNav
              activeSection={activeOverviewSection}
              setActiveSection={setActiveOverviewSection}
            />
            <section className="section-commandbar host-accent rounded-lg px-3.5 py-2.5 sm:px-5 sm:py-3">
              <p className="text-[10px] font-bold uppercase text-trophy-300 light:text-trophy-700 sm:text-xs">
                {t("overviewCurrentSection")}
              </p>
              <h2 className="mt-0.5 text-xl font-black text-white light:text-slate-950 sm:mt-1 sm:text-2xl">
                {t(activeOverviewMeta.titleKey)}
              </h2>
              <p className="mt-1 line-clamp-1 max-w-3xl text-xs leading-5 text-slate-300 light:text-slate-700 sm:mt-2 sm:text-sm sm:leading-6">
                {t(activeOverviewMeta.descriptionKey)}
              </p>
            </section>

            {activeOverviewSection === "home" && (
              <OverviewHome
                bracketState={bracketState}
                onSelectPlayer={setSelectedPlayer}
                onSelectTeam={setSelectedTeam}
                players={runtimeData.players}
                experienceMode={experienceMode}
                setActiveSection={setActiveOverviewSection}
                teams={runtimeData.teams}
              />
            )}

            {activeOverviewSection === "groups" && (
              <>
                <FilterBar filters={filters} setFilters={setFilters} />
                <GroupStagePredictor groups={groups} teams={runtimeData.teams} />
                <GroupGrid
                  experienceMode={experienceMode}
                  groups={groups}
                  teams={visibleTeams}
                  filters={filters}
                  onSelectTeam={setSelectedTeam}
                />
                <RegionOverview teams={runtimeData.teams} />
              </>
            )}

            {activeOverviewSection === "knockout" && (
              <>
                <PredictionSummary teams={runtimeData.teams} players={runtimeData.players} bracketState={bracketState} />
                <ScheduleSnapshotPanel teams={runtimeData.teams} />
                <BracketView
                  bracketState={bracketState}
                  players={runtimeData.players}
                  setBracketState={setBracketState}
                  teams={runtimeData.teams}
                />
                <PosterExportPanel
                  bracketState={bracketState}
                  players={runtimeData.players}
                  teams={runtimeData.teams}
                />
              </>
            )}

            {activeOverviewSection === "players" && (
              <>
                <PlayerDataCenter
                  onSelectPlayer={setSelectedPlayer}
                  players={runtimeData.players}
                  teams={runtimeData.teams}
                />
                <div className="hidden sm:block">
                  <TeamCompare teams={runtimeData.teams} players={runtimeData.players} />
                </div>
                <details className="sm:hidden">
                  <summary className="cursor-pointer rounded-lg border border-white/10 bg-[#06152d]/80 px-4 py-3 text-sm font-black text-white light:border-slate-900/10 light:bg-white light:text-slate-950">
                    {t("teamCompare")}
                  </summary>
                  <div className="mt-2">
                    <TeamCompare teams={runtimeData.teams} players={runtimeData.players} />
                  </div>
                </details>
                <div className="hidden sm:block">
                  <PhotoAuditPanel players={runtimeData.players} />
                </div>
                <details className="sm:hidden">
                  <summary className="cursor-pointer rounded-lg border border-white/10 bg-[#06152d]/80 px-4 py-3 text-sm font-black text-white light:border-slate-900/10 light:bg-white light:text-slate-950">
                    {t("photoPanelTitle")}
                  </summary>
                  <div className="mt-2">
                    <PhotoAuditPanel players={runtimeData.players} />
                  </div>
                </details>
              </>
            )}

            {activeOverviewSection === "beginner" && (
              <>
                <BeginnerPathPanel />
                <BeginnerIntroPanel />
                <MatchWatchingGuide teams={runtimeData.teams} players={runtimeData.players} experienceMode={experienceMode} />
                <WatchGuidePanel teams={runtimeData.teams} />
                <GlossaryPanel />
              </>
            )}

            {activeOverviewSection === "stories" && <OffFieldStoriesPanel />}

            {activeOverviewSection === "data" && (
              <>
                <ModelDataPanel />
                <DataQualityPanel players={runtimeData.players} teams={runtimeData.teams} />
                <DataImportExport
                  bracketState={bracketState}
                  onImportPrediction={setBracketState}
                  onImportRuntimeData={importRuntimeData}
                  runtimeData={runtimeData}
                />
                <PosterExportPanel
                  bracketState={bracketState}
                  players={runtimeData.players}
                  teams={runtimeData.teams}
                />
              </>
            )}
          </>
        ) : (
          <BracketView
            bracketState={bracketState}
            players={runtimeData.players}
            setBracketState={setBracketState}
            teams={runtimeData.teams}
          />
        )}
        </Suspense>
      </main>

      <footer className="mx-auto max-w-[1440px] px-4 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-400 light:border-slate-900/10 light:bg-white/70 light:text-slate-600">
          {t("dataNotice")}
        </div>
      </footer>

      <Suspense fallback={<ModalFallback />}>
      {selectedTeam && (
        <TeamModal
          onClose={() => setSelectedTeam(null)}
          onSelectPlayer={setSelectedPlayer}
          players={selectedTeamPlayers}
          experienceMode={experienceMode}
          team={selectedTeam}
        />
      )}

      {selectedPlayer && (
        <PlayerModal onClose={() => setSelectedPlayer(null)} player={selectedPlayer} team={selectedPlayerTeam} />
      )}
      </Suspense>
    </div>
  );
}

const LazyPanelFallback = () => {
  const { t } = useLanguage();

  return (
    <section className="glass-panel rounded-lg p-6">
      <div className="h-2 w-24 animate-pulse rounded-full bg-trophy-400/70" />
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div className="h-28 animate-pulse rounded-lg border border-white/10 bg-white/5" key={item} />
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-400 light:text-slate-600">{t("loadingSection")}</p>
    </section>
  );
};

const ModalFallback = () => {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/75 backdrop-blur-sm">
      <div className="glass-panel rounded-lg p-5 text-sm font-bold text-slate-200">{t("loadingSection")}</div>
    </div>
  );
};
