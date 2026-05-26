import { BarChart3, Crown, Sparkles, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { useLanguage } from "../i18n";
import type { BracketPredictionState, Player, Team } from "../types/worldCup";
import { getChampionId } from "../utils/bracket";
import { displayTeamName } from "../utils/localizedNames";
import { TeamFlag } from "./TeamFlag";

interface PredictionSummaryProps {
  teams: Team[];
  players: Player[];
  bracketState: BracketPredictionState;
}

export const PredictionSummary = ({ teams, players, bracketState }: PredictionSummaryProps) => {
  const { language, t } = useLanguage();
  const champion =
    teams.find((team) => team.id === getChampionId(bracketState)) ??
    teams.find((team) => team.predictedStage === "Champion");
  const contenders = teams.filter((team) => ["Champion", "Final", "Semi-final"].includes(team.predictedStage)).length;
  const darkHorses = teams.filter((team) => team.isDarkHorse).length;
  const corePlayers = players.filter((player) => player.isKeyPlayer).length;

  const championValue = champion ? (
    <span className="inline-flex min-w-0 items-center gap-2">
      <TeamFlag team={champion} size="sm" />
      <span className="truncate">{displayTeamName(champion, language)}</span>
    </span>
  ) : (
    t("notSelected")
  );

  const cards: Array<{ label: string; value: ReactNode; icon: typeof Crown; tone: string }> = [
    {
      label: t("championPrediction"),
      value: championValue,
      icon: Crown,
      tone: "text-trophy-300",
    },
    {
      label: t("titleContenders"),
      value: `${contenders} ${t("teamsUnit")}`,
      icon: Trophy,
      tone: "text-emerald-300",
    },
    {
      label: t("darkHorseTeams"),
      value: `${darkHorses} ${t("teamsUnit")}`,
      icon: Sparkles,
      tone: "text-orange-300",
    },
    {
      label: t("corePlayerSample"),
      value: `${corePlayers} ${t("playersUnit")}`,
      icon: BarChart3,
      tone: "text-sky-300",
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article key={card.label} className="glass-panel rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400 light:text-slate-500">{card.label}</p>
              <Icon className={card.tone} size={20} />
            </div>
            <p className="mt-3 text-2xl font-black text-white light:text-slate-950">{card.value}</p>
          </article>
        );
      })}
    </section>
  );
};
