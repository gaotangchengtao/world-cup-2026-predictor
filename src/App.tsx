import { useEffect, useMemo, useState } from "react";
import { BracketView } from "./components/BracketView";
import { DataImportExport } from "./components/DataImportExport";
import { FilterBar } from "./components/FilterBar";
import { GroupGrid } from "./components/GroupGrid";
import { GroupStagePredictor } from "./components/GroupStagePredictor";
import { Header } from "./components/Header";
import { PlayerModal } from "./components/PlayerModal";
import { PredictionSummary } from "./components/PredictionSummary";
import { TeamCompare } from "./components/TeamCompare";
import { TeamModal } from "./components/TeamModal";
import { TopPlayers } from "./components/TopPlayers";
import { groups } from "./data/groups";
import { players as defaultPlayers } from "./data/players";
import { teams as defaultTeams } from "./data/teams";
import { useLanguage } from "./i18n";
import type { BracketPredictionState, FilterState, Player, RuntimeData, Team } from "./types/worldCup";
import { createInitialBracketState } from "./utils/bracket";
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

export default function App() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<"overview" | "predictor">(() =>
    readJson(storageKeys.mode, "overview" as "overview" | "predictor"),
  );
  const [theme, setTheme] = useState<"dark" | "light">(() => readJson(storageKeys.theme, "dark" as "dark" | "light"));
  const [runtimeData, setRuntimeData] = useState<RuntimeData>(() =>
    readJson(storageKeys.runtimeData, defaultRuntimeData),
  );
  const [bracketState, setBracketState] = useState<BracketPredictionState>(() =>
    readJson(storageKeys.bracketPredictions, createInitialBracketState()),
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
    writeJson(storageKeys.bracketPredictions, bracketState);
  }, [bracketState]);

  useEffect(() => {
    writeJson(storageKeys.runtimeData, runtimeData);
  }, [runtimeData]);

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

  return (
    <div className={`${theme} stadium-bg min-h-screen text-slate-100 light:text-slate-900`}>
      <Header
        mode={mode}
        setMode={setMode}
        theme={theme}
        toggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
      />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
        <section className="glass-panel rounded-lg p-5 sm:p-7">
          <div className="max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-trophy-300 light:text-trophy-700">
              {t("heroKicker")}
            </p>
            <h2 className="mt-3 text-3xl font-black text-white light:text-slate-950 sm:text-5xl">
              {t("heroTitle")}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 light:text-slate-700">
              {t("heroDescription")}
            </p>
          </div>
        </section>

        <PredictionSummary teams={runtimeData.teams} players={runtimeData.players} bracketState={bracketState} />

        {mode === "overview" ? (
          <>
            <FilterBar filters={filters} setFilters={setFilters} />
            <GroupStagePredictor groups={groups} teams={runtimeData.teams} />
            <GroupGrid groups={groups} teams={visibleTeams} filters={filters} onSelectTeam={setSelectedTeam} />
            <TopPlayers players={runtimeData.players} teams={runtimeData.teams} onSelectPlayer={setSelectedPlayer} />
            <TeamCompare teams={runtimeData.teams} players={runtimeData.players} />
            <DataImportExport
              bracketState={bracketState}
              onImportPrediction={setBracketState}
              onImportRuntimeData={setRuntimeData}
              runtimeData={runtimeData}
            />
          </>
        ) : (
          <>
            <BracketView bracketState={bracketState} setBracketState={setBracketState} teams={runtimeData.teams} />
            <DataImportExport
              bracketState={bracketState}
              onImportPrediction={setBracketState}
              onImportRuntimeData={setRuntimeData}
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
          team={selectedTeam}
        />
      )}

      {selectedPlayer && (
        <PlayerModal onClose={() => setSelectedPlayer(null)} player={selectedPlayer} team={selectedPlayerTeam} />
      )}
    </div>
  );
}
