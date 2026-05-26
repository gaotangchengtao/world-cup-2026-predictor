import { BarChart3, Crown, Sparkles, Trophy } from "lucide-react";
import type { Player, Team } from "../types/worldCup";
import { getChampionId } from "../utils/bracket";
import type { BracketPredictionState } from "../types/worldCup";

interface PredictionSummaryProps {
  teams: Team[];
  players: Player[];
  bracketState: BracketPredictionState;
}

export const PredictionSummary = ({ teams, players, bracketState }: PredictionSummaryProps) => {
  const champion = teams.find((team) => team.id === getChampionId(bracketState)) ?? teams.find((team) => team.predictedStage === "Champion");
  const contenders = teams.filter((team) => ["Champion", "Final", "Semi-final"].includes(team.predictedStage)).length;
  const darkHorses = teams.filter((team) => team.isDarkHorse).length;
  const corePlayers = players.filter((player) => player.isKeyPlayer).length;

  const cards = [
    {
      label: "我的冠军预测",
      value: champion ? `${champion.flag} ${champion.name}` : "尚未选择",
      icon: Crown,
      tone: "text-trophy-300",
    },
    {
      label: "冠军热门",
      value: `${contenders} teams`,
      icon: Trophy,
      tone: "text-emerald-300",
    },
    {
      label: "黑马球队",
      value: `${darkHorses} teams`,
      icon: Sparkles,
      tone: "text-orange-300",
    },
    {
      label: "核心球员样本",
      value: `${corePlayers} players`,
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
