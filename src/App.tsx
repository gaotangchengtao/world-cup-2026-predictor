import { useEffect, useMemo, useState } from "react";
import { BeginnerIntroPanel } from "./components/BeginnerIntroPanel";
import { BeginnerPathPanel } from "./components/BeginnerPathPanel";
import { BracketView } from "./components/BracketView";
import { DataQualityPanel } from "./components/DataQualityPanel";
import { DataImportExport } from "./components/DataImportExport";
import { FilterBar } from "./components/FilterBar";
import { GlossaryPanel } from "./components/GlossaryPanel";
import { GroupGrid } from "./components/GroupGrid";
import { GroupStagePredictor } from "./components/GroupStagePredictor";
import { Header } from "./components/Header";
import { MatchWatchingGuide } from "./components/MatchWatchingGuide";
import { OverviewHome } from "./components/OverviewHome";
import { OverviewSectionNav, overviewSectionMeta } from "./components/OverviewSectionNav";
import { PlayerModal } from "./components/PlayerModal";
import { PhotoAuditPanel } from "./components/PhotoAuditPanel";
import { PosterExportPanel } from "./components/PosterExportPanel";
import { PredictionSummary } from "./components/PredictionSummary";
import { RegionOverview } from "./components/RegionOverview";
import { TeamCompare } from "./components/TeamCompare";
import { TeamModal } from "./components/TeamModal";
import { TopPlayers } from "./components/TopPlayers";
import { WatchGuidePanel } from "./components/WatchGuidePanel";
import { groups } from "./data/groups";
import { players as defaultPlayers } from "./data/players";
import { teams as defaultTeams } from "./data/teams";
import { useLanguage } from "./i18n";
import type { BracketPredictionState, ExperienceMode, FilterState, OverviewSection, Player, RuntimeData, Team } from "./types/worldCup";
import { completeBracketState, createInitialBracketState } from "./utils/bracket";
import { stageOrder } from "./utils/format";
import { teamSearchText } from "./utils/localizedNames";
import { readJson, storageKeys, writeJson } from "./utils/storage";

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

const contenderStages = new Set(["Champion", "Final", "Semi-final", "Quarter-final"]);
const overviewSectionIds: OverviewSection[] = ["home", "groups", "knockout", "players", "beginner", "data"];

const mergeDefaultRuntimeData = (data: RuntimeData): RuntimeData => {
  const teamIds = new Set(data.teams.map((team) => team.id));
  const playerIds = new Set(data.players.map((player) => player.playerId));

  return {
    ...data,
    teams: [...data.teams, ...defaultTeams.filter((team) => !teamIds.has(team.id))],
    players: [...data.players, ...defaultPlayers.filter((player) => !playerIds.has(player.playerId))],
  };
};

const readOverviewSection = () => {
  const saved = readJson(storageKeys.overviewSection, "home" as OverviewSection);
  return overviewSectionIds.includes(saved) ? saved : "home";
};

export default function App() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<"overview" | "predictor">(() =>
    readJson(storageKeys.mode, "overview" as "overview" | "predictor"),
  );
  const [theme, setTheme] = useState<"dark" | "light">(() => readJson(storageKeys.theme, "dark" as "dark" | "light"));
  const [experienceMode, setExperienceMode] = useState<ExperienceMode>(() =>
    readJson(storageKeys.experienceMode, "beginner" as ExperienceMode),
  );
  const [activeOverviewSection, setActiveOverviewSection] = useState<OverviewSection>(readOverviewSection);
  const [runtimeData, setRuntimeData] = useState<RuntimeData>(() =>
    mergeDefaultRuntimeData(readJson(storageKeys.runtimeData, defaultRuntimeData)),
  );
  const [bracketState, setBracketState] = useState<BracketPredictionState>(() =>
    completeBracketState(
      readJson(storageKeys.bracketPredictions, createInitialBracketState(runtimeData.teams)),
      runtimeData.teams,
    ),
  );
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
  }, [bracketState]);

  useEffect(() => {
    writeJson(storageKeys.runtimeData, runtimeData);
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

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:py-6">
        <section className="glass-panel rounded-lg p-4 sm:p-5">
          <div className="max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-trophy-300 light:text-trophy-700">
              {t("heroKicker")}
            </p>
            <h2 className="mt-2 text-2xl font-black text-white light:text-slate-950 sm:text-4xl">
              {t("heroTitle")}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 light:text-slate-700 sm:text-base">
              {t("heroDescription")}
            </p>
          </div>
        </section>

        {mode === "overview" ? (
          <>
            <OverviewSectionNav
              activeSection={activeOverviewSection}
              setActiveSection={setActiveOverviewSection}
            />
            <section className="rounded-lg border border-white/10 bg-slate-950/35 p-4 light:border-slate-900/10 light:bg-white/70">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-trophy-300 light:text-trophy-700">
                {t("overviewCurrentSection")}
              </p>
              <h2 className="mt-1 text-2xl font-black text-white light:text-slate-950">
                {t(activeOverviewMeta.titleKey)}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 light:text-slate-700">
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
                <TopPlayers players={runtimeData.players} teams={runtimeData.teams} onSelectPlayer={setSelectedPlayer} />
                <TeamCompare teams={runtimeData.teams} players={runtimeData.players} />
                <PhotoAuditPanel players={runtimeData.players} />
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

            {activeOverviewSection === "data" && (
              <>
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
          <>
            <PredictionSummary teams={runtimeData.teams} players={runtimeData.players} bracketState={bracketState} />
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
            <DataImportExport
              bracketState={bracketState}
              onImportPrediction={setBracketState}
              onImportRuntimeData={importRuntimeData}
              runtimeData={runtimeData}
            />
          </>
        )}
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-400 light:border-slate-900/10 light:bg-white/70 light:text-slate-600">
          {t("dataNotice")}
        </div>
      </footer>

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
    </div>
  );
}
