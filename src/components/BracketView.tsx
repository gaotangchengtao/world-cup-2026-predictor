import { Download, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { useState } from "react";
import { defaultBracketRounds } from "../data/bracket";
import { useLanguage } from "../i18n";
import type { BracketPredictionState, Player, Team } from "../types/worldCup";
import { chooseWinner, createInitialBracketState, createRecommendedBracketState, getChampionId, updateSlot } from "../utils/bracket";
import { downloadJson, getTeamById } from "../utils/format";
import { displayTeamName } from "../utils/localizedNames";
import { getRecommendedWinnerId } from "../utils/modelPredictions";
import { BracketRound } from "./BracketRound";
import { ExplanationCard } from "./ExplanationCard";
import { TeamFlag } from "./TeamFlag";

interface BracketViewProps {
  teams: Team[];
  players: Player[];
  bracketState: BracketPredictionState;
  setBracketState: (state: BracketPredictionState) => void;
}

export const BracketView = ({ teams, players, bracketState, setBracketState }: BracketViewProps) => {
  const { language, t } = useLanguage();
  const [activeMobileRound, setActiveMobileRound] = useState("round-32");
  const champion = getTeamById(teams, getChampionId(bracketState));

  const handleSlotChange = (matchId: string, slotKey: "slotA" | "slotB", teamId: string) => {
    setBracketState(updateSlot(bracketState, matchId, slotKey, teamId, teams));
  };

  const handleChooseWinner = (matchId: string, teamId: string) => {
    setBracketState(chooseWinner(bracketState, matchId, teamId, teams));
  };

  const handleModelRecommendation = () => {
    setBracketState(
      createRecommendedBracketState(teams, (slotA, slotB, availableTeams) => {
        const teamA = getTeamById(availableTeams, slotA);
        const teamB = getTeamById(availableTeams, slotB);
        return getRecommendedWinnerId(teamA, teamB, players);
      }),
    );
  };

  const scrollToRound = (roundId: string) => {
    setActiveMobileRound(roundId);
    document.getElementById(`bracket-${roundId}`)?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  const scrollToChampion = () => {
    setActiveMobileRound("champion");
    document.getElementById("bracket-champion")?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  return (
    <section className="space-y-4">
      <div className="glass-panel rounded-lg p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-white light:text-slate-950">{t("bracketTitle")}</h2>
            <p className="text-sm text-slate-400 light:text-slate-600">{t("bracketDescription")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-trophy-500/30 bg-trophy-500/10 px-3 py-2 text-sm font-black text-trophy-100 hover:border-trophy-500 light:text-trophy-800"
              onClick={handleModelRecommendation}
              type="button"
            >
              <Sparkles size={16} />
              {t("useModelRecommendation")}
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10 light:border-slate-900/10 light:text-slate-700"
              onClick={() => setBracketState(createInitialBracketState(teams))}
              type="button"
            >
              <RotateCcw size={16} />
              {t("resetPrediction")}
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-trophy-500 px-3 py-2 text-sm font-black text-slate-950 hover:bg-trophy-300"
              onClick={() => downloadJson("wc2026-bracket-prediction.json", { bracketState })}
              type="button"
            >
              <Download size={16} />
              {t("exportJson")}
            </button>
          </div>
        </div>
      </div>

      <div className="bracket-scroll overflow-x-auto rounded-lg border border-white/10 bg-slate-950/35 p-4 light:border-slate-900/10 light:bg-white/50">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400 light:text-slate-600 md:hidden">
          {t("swipeBracketHint")}
        </p>
        <div className="sticky top-16 z-20 mb-3 flex min-w-max gap-2 rounded-lg border border-white/10 bg-slate-950/85 p-1 backdrop-blur md:hidden">
          {defaultBracketRounds.map((round) => (
            <button
              className={`rounded-md px-3 py-2 text-xs font-black transition ${
                activeMobileRound === round.id
                  ? "bg-trophy-500 text-slate-950"
                  : "border border-white/10 bg-white/5 text-slate-200 light:border-slate-900/10 light:bg-white light:text-slate-700"
              }`}
              key={round.id}
              onClick={() => scrollToRound(round.id)}
              type="button"
            >
              {round.id === "round-32"
                ? t("stageRoundOf32")
                : round.id === "round-16"
                  ? t("stageRoundOf16")
                  : round.id === "quarter-finals"
                    ? t("stageQuarterFinal")
                    : round.id === "semi-finals"
                      ? t("stageSemiFinal")
                      : t("stageFinal")}
            </button>
          ))}
          <button
            className={`rounded-md px-3 py-2 text-xs font-black transition ${
              activeMobileRound === "champion"
                ? "bg-trophy-500 text-slate-950"
                : "border border-white/10 bg-white/5 text-slate-200 light:border-slate-900/10 light:bg-white light:text-slate-700"
            }`}
            onClick={scrollToChampion}
            type="button"
          >
            {t("champion")}
          </button>
        </div>
        <div className="flex min-w-full snap-x snap-mandatory gap-4 md:min-w-max">
          {defaultBracketRounds.map((round) => (
            <BracketRound
              bracketState={bracketState}
              key={round.id}
              onChooseWinner={handleChooseWinner}
              onSlotChange={handleSlotChange}
              round={round}
              teams={teams}
              players={players}
            />
          ))}
          <section className="flex min-w-[calc(100vw-2rem)] snap-start flex-col gap-3 sm:min-w-[320px]" id="bracket-champion">
            <div className="sticky top-20 z-10 rounded-lg border border-trophy-500/40 bg-trophy-500/20 px-4 py-3 text-center">
              <h2 className="text-base font-black text-trophy-100 light:text-trophy-800">{t("champion")}</h2>
              <p className="text-xs text-trophy-200 light:text-trophy-700">{t("finalWinner")}</p>
            </div>
            <article className="rounded-lg border border-trophy-500/50 bg-trophy-500/15 p-5 text-center shadow-glow">
              <Trophy className="mx-auto text-trophy-300" size={36} />
              <div className="mt-3 flex justify-center">
                <TeamFlag team={champion} size="xl" />
              </div>
              <h3 className="mt-3 text-2xl font-black text-white light:text-slate-950">
                {champion ? displayTeamName(champion, language) : t("selectFinalWinner")}
              </h3>
              {champion && (
                <p className="mt-2 text-sm font-bold text-trophy-200 light:text-trophy-800">
                  #{champion.strengthRank} · {t("score")} {champion.strengthScore}
                </p>
              )}
            </article>
            {champion && <ExplanationCard compact players={players} team={champion} />}
          </section>
        </div>
      </div>
    </section>
  );
};
