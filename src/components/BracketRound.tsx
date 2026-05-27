import type { BracketPredictionState, BracketRound as BracketRoundType, Player, Team } from "../types/worldCup";
import { useLanguage } from "../i18n";
import { BracketMatch } from "./BracketMatch";

interface BracketRoundProps {
  round: BracketRoundType;
  bracketState: BracketPredictionState;
  teams: Team[];
  players: Player[];
  onSlotChange: (matchId: string, slotKey: "slotA" | "slotB", teamId: string) => void;
  onChooseWinner: (matchId: string, teamId: string) => void;
}

export const BracketRound = ({ round, bracketState, teams, players, onSlotChange, onChooseWinner }: BracketRoundProps) => {
  const { t } = useLanguage();
  const roundName =
    round.id === "round-32"
      ? t("stageRoundOf32")
      : round.id === "round-16"
        ? t("stageRoundOf16")
        : round.id === "quarter-finals"
          ? t("stageQuarterFinal")
          : round.id === "semi-finals"
            ? t("stageSemiFinal")
            : t("stageFinal");

  return (
    <section className="flex min-w-[calc(100vw-2rem)] snap-start flex-col gap-3 sm:min-w-[320px]" id={`bracket-${round.id}`}>
    <div className="sticky top-20 z-10 rounded-lg border border-white/10 bg-slate-950/90 px-4 py-3 text-center light:border-slate-900/10 light:bg-white/90">
      <h2 className="text-base font-black text-white light:text-slate-950">{roundName}</h2>
      <p className="text-xs text-slate-500">
        {round.matches.length} {t("matches")}
      </p>
    </div>
    <div className="grid gap-4">
      {round.matches.map((match) => (
        <BracketMatch
          key={match.id}
          match={match}
          matchState={bracketState[match.id] ?? {}}
          onChooseWinner={onChooseWinner}
          onSlotChange={onSlotChange}
          players={players}
          teams={teams}
        />
      ))}
    </div>
    </section>
  );
};
