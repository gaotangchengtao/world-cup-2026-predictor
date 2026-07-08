import { AlertTriangle, LineChart, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { useLanguage } from "../i18n";
import type { BracketPredictionState, Player, Team } from "../types/worldCup";
import { getBracketChampionProbabilities, getModelConfidenceLeaders, getUpsetWatchMatchups } from "../utils/modelPredictions";
import { displayTeamName } from "../utils/localizedNames";
import { TeamFlag } from "./TeamFlag";

interface ModelInsightsPanelProps {
  bracketState: BracketPredictionState;
  onSelectTeam: (team: Team) => void;
  players: Player[];
  teams: Team[];
}

export const ModelInsightsPanel = ({ bracketState, onSelectTeam, players, teams }: ModelInsightsPanelProps) => {
  const { language, t } = useLanguage();
  const contenders = getBracketChampionProbabilities(teams, players, bracketState, 5);
  const confidenceLeaders = getModelConfidenceLeaders(teams, players, 5);
  const upsetRows = getUpsetWatchMatchups(teams, players, bracketState, 5);

  return (
    <section className="mobile-snap-grid grid gap-3 sm:gap-4 xl:grid-cols-3">
      <article className="mobile-snap-card glass-panel rounded-lg p-3.5 sm:p-4">
        <PanelTitle icon={<Trophy size={20} />} title={t("mlChampionHotlist")} />
        <div className="mt-4 grid gap-2">
          {contenders.map(({ team, profile, championshipProbability }, index) => (
            <button
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-left transition hover:border-trophy-500 light:border-slate-900/10 light:bg-white"
              key={team.id}
              onClick={() => onSelectTeam(team)}
              type="button"
            >
              <span className="w-6 text-sm font-black text-trophy-300">#{index + 1}</span>
              <TeamFlag team={team} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-white light:text-slate-950">
                {displayTeamName(team, language)}
              </span>
              <span className="text-sm font-black text-trophy-300 light:text-trophy-700">
                {Math.round(championshipProbability * 100)}%
              </span>
              <span className="hidden text-xs font-black text-slate-400 light:text-slate-600 sm:inline">
                {profile.mlStrengthScore}
              </span>
            </button>
          ))}
        </div>
      </article>

      <article className="mobile-snap-card glass-panel rounded-lg p-3.5 sm:p-4">
        <PanelTitle icon={<LineChart size={20} />} title={t("modelConfidenceLeaders")} />
        <div className="mt-4 grid gap-2">
          {confidenceLeaders.map(({ team, profile }) => (
            <button
              className="rounded-lg border border-white/10 bg-white/5 p-3 text-left transition hover:border-sky-400 light:border-slate-900/10 light:bg-white"
              key={team.id}
              onClick={() => onSelectTeam(team)}
              type="button"
            >
              <div className="flex items-center gap-2">
                <TeamFlag team={team} size="sm" />
                <p className="min-w-0 flex-1 truncate text-sm font-black text-white light:text-slate-950">
                  {displayTeamName(team, language)}
                </p>
                <span className="text-xs font-black text-sky-300 light:text-sky-700">{profile.confidenceScore}/100</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-900/70 light:bg-slate-200">
                <div className="h-full rounded-full bg-sky-400" style={{ width: `${profile.confidenceScore}%` }} />
              </div>
            </button>
          ))}
        </div>
      </article>

      <article className="mobile-snap-card glass-panel rounded-lg p-3.5 sm:p-4">
        <PanelTitle icon={<AlertTriangle size={20} />} title={t("modelUpsetWatchlist")} />
        <div className="mt-4 grid gap-2">
          {upsetRows.map((row) => (
            <div
              className="rounded-lg border border-orange-400/20 bg-orange-500/10 p-3"
              key={row.match.id}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-black text-white light:text-slate-950">
                  {displayTeamName(row.underdog, language)}
                </span>
                <span className="rounded-md bg-orange-400/15 px-2 py-1 text-xs font-black text-orange-200 light:text-orange-700">
                  {Math.round(row.underdogProbability * 100)}%
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-300 light:text-slate-700">
                {t("upsetPathAgainst")} {displayTeamName(row.favorite, language)}
              </p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
};

const PanelTitle = ({ icon, title }: { icon: ReactNode; title: string }) => (
  <div className="flex items-center gap-2">
    <span className="text-trophy-300">{icon}</span>
    <h2 className="text-lg font-black text-white light:text-slate-950">{title}</h2>
  </div>
);
