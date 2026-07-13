import { Check, ShieldAlert, Sparkles, ThermometerSun, X } from "lucide-react";
import { useLanguage } from "../i18n";
import type {
  BracketMatch,
  BracketMatchState,
  MatchupPrediction,
  Player,
  Team,
} from "../types/worldCup";
import { displayTeamName } from "../utils/localizedNames";
import { getRecommendedWinnerId, getScheduledMatchPrediction } from "../utils/modelPredictions";
import { PredictedScoreCard } from "./PredictedScoreCard";
import { TeamFlag } from "./TeamFlag";

interface BracketMatchDrawerProps {
  match: BracketMatch;
  matchState: BracketMatchState;
  teams: Team[];
  players: Player[];
  prediction: MatchupPrediction | null;
  onChooseWinner: (teamId: string) => void;
  onClose: () => void;
}

const factorKeyMap = {
  mlStrength: "mlStrengthScore",
  recentForm: "recentFormScore",
  currentTournamentForm: "currentTournamentForm",
  preTournamentPrior: "preTournamentPrior",
  historicalClassifier: "historicalClassifier",
  environmentReadiness: "environmentReadiness",
  attackDefense: "attackDefenseBalance",
  squadAvailability: "squadAvailability",
  tacticalFit: "tacticalFit",
  playerFit: "playerFit",
  squadCohesion: "squadCohesion",
  coachAdaptability: "coachAdaptability",
  strengthRank: "strengthRank",
  squadValue: "squadValue",
} as const;

export const BracketMatchDrawer = ({
  match,
  matchState,
  teams,
  players,
  prediction,
  onChooseWinner,
  onClose,
}: BracketMatchDrawerProps) => {
  const { language, t } = useLanguage();
  const teamA = teams.find((team) => team.id === matchState.slotA);
  const teamB = teams.find((team) => team.id === matchState.slotB);
  const recommendedWinnerId = getRecommendedWinnerId(teamA, teamB, players, match.matchNumber);
  const recommendedWinner = teams.find((team) => team.id === recommendedWinnerId);
  const environment = getScheduledMatchPrediction(match.matchNumber);

  return (
    <aside className="fixed inset-x-0 bottom-0 z-40 max-h-[82dvh] overflow-y-auto rounded-t-lg border border-white/10 bg-[#06113a] p-4 shadow-[0_-20px_70px_rgba(2,6,23,0.6)] backdrop-blur sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[430px] sm:rounded-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
            {t("roadMatchPrediction")}
          </p>
          <h3 className="mt-1 text-xl font-black text-white">
            {t("match")} {match.matchNumber}
          </h3>
          <p className="mt-1 text-xs text-slate-400">{match.slotA.label} · {match.slotB.label}</p>
        </div>
        <button
          className="rounded-md border border-white/10 p-2 text-slate-300 hover:bg-white/10"
          onClick={onClose}
          title={t("close")}
          type="button"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-start gap-3">
        <DrawerTeam team={teamA} />
        <span className="pt-7 text-xs font-black text-slate-500">VS</span>
        <DrawerTeam team={teamB} />
      </div>

      {prediction && teamA && teamB && (
        <PredictedScoreCard
          score={prediction.scorePrediction}
          teamAName={displayTeamName(teamA, language)}
          teamBName={displayTeamName(teamB, language)}
        />
      )}

      {environment && (
        <section className="mt-4 rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-3">
          <p className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.14em] text-cyan-200">
            <ThermometerSun size={15} />
            {t("matchEnvironment")}
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <EnvironmentMetric label={t("temperature")} value={`${environment.temperatureC}°C`} />
            <EnvironmentMetric label={t("humidity")} value={`${environment.humidityPct}%`} />
            <EnvironmentMetric label={t("altitude")} value={`${environment.altitudeM} m`} />
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-300">
            {displayTeamName(teamA, language)}: {environment.teamARestDays} {t("restDays")} · {environment.teamATravelDistanceKm} km
            {" · "}
            {displayTeamName(teamB, language)}: {environment.teamBRestDays} {t("restDays")} · {environment.teamBTravelDistanceKm} km
          </p>
        </section>
      )}

      {prediction && teamA && teamB ? (
        <>
          <div className="mt-4 rounded-lg border border-sky-400/20 bg-sky-500/10 p-3">
            <div className="flex items-center justify-between text-xs font-black text-sky-100">
              <span>{displayTeamName(teamA, language)} {Math.round(prediction.teamAAdvanceProbability * 100)}%</span>
              <span>{Math.round(prediction.teamBAdvanceProbability * 100)}% {displayTeamName(teamB, language)}</span>
            </div>
            <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-slate-950/60">
              <div
                className="bg-sky-400"
                style={{ width: `${prediction.teamAAdvanceProbability * 100}%` }}
              />
              <div
                className="bg-orange-400"
                style={{ width: `${prediction.teamBAdvanceProbability * 100}%` }}
              />
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-yellow-300/20 bg-yellow-300/10 p-3">
            <div className="flex items-center gap-2 text-yellow-200">
              <Sparkles size={16} />
              <p className="text-sm font-black">
                {t("roadModelFavors")} {recommendedWinner ? displayTeamName(recommendedWinner, language) : t("notSelected")}
              </p>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-300">
              {t("predictionFactors")}{" "}
              {prediction.topFactors
                .map((factor) => t(factorKeyMap[factor as keyof typeof factorKeyMap]))
                .join(" / ")}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              {language === "zh"
                ? "胜率会综合本届状态、人员可用性、战术适配、球员角色适配和教练调整能力。"
                : "The probability blends current tournament form, availability, tactical fit, player-role fit, and coach adaptability."}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {[teamA, teamB].map((team) => {
              const isWinner = matchState.winnerTeamId === team.id;
              return (
                <button
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-black transition ${
                    isWinner
                      ? "border-yellow-300 bg-yellow-300 text-slate-950"
                      : "border-white/10 bg-white/5 text-white hover:border-sky-300/60"
                  }`}
                  key={team.id}
                  onClick={() => onChooseWinner(team.id)}
                  type="button"
                >
                  {isWinner ? <Check size={16} /> : <TeamFlag team={team} size="sm" />}
                  <span className="truncate">{displayTeamName(team, language)}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-orange-400/20 bg-orange-500/10 p-3 text-sm text-orange-100">
          <ShieldAlert className="mt-0.5 shrink-0" size={17} />
          <p>{t("roadWaitingForTeams")}</p>
        </div>
      )}
    </aside>
  );
};

const EnvironmentMetric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md border border-white/10 bg-slate-950/30 px-2 py-2">
    <p className="text-[10px] uppercase text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-black text-white">{value}</p>
  </div>
);

const DrawerTeam = ({ team }: { team?: Team }) => {
  const { language, t } = useLanguage();
  return (
    <div className="min-w-0 text-center">
      <div className="flex justify-center">
        <TeamFlag team={team} size="xl" />
      </div>
      <p className="mt-2 truncate text-sm font-black text-white">
        {team ? displayTeamName(team, language) : t("notSelected")}
      </p>
      {team && <p className="mt-1 text-xs text-slate-400">#{team.strengthRank} · {team.strengthScore}</p>}
    </div>
  );
};
