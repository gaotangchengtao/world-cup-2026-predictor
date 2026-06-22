import {
  Download,
  LockKeyhole,
  MousePointerClick,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../i18n";
import type { BracketPredictionState, Player, Team } from "../types/worldCup";
import {
  chooseWinner,
  createRecommendedBracketState,
  findFeederMatch,
  findMatch,
  getLegalSlotCandidates,
  selectLegalSlotTeam,
  type WinnerPicker,
} from "../utils/bracket";
import { downloadJson, getTeamById } from "../utils/format";
import { getMatchupPrediction, getRecommendedWinnerId } from "../utils/modelPredictions";
import { BracketMatchDrawer } from "./BracketMatchDrawer";
import { BracketTeamPicker } from "./BracketTeamPicker";
import { ChampionshipRoad } from "./ChampionshipRoad";

interface BracketViewProps {
  teams: Team[];
  players: Player[];
  bracketState: BracketPredictionState;
  setBracketState: (state: BracketPredictionState) => void;
}

interface PickerTarget {
  matchId: string;
  slotKey: "slotA" | "slotB";
}

export const BracketView = ({
  teams,
  players,
  bracketState,
  setBracketState,
}: BracketViewProps) => {
  const { t } = useLanguage();
  const [selectedMatchId, setSelectedMatchId] = useState<string>();
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>();
  const roadScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = roadScrollRef.current;
    if (!scrollContainer || window.innerWidth >= 640) return;
    scrollContainer.scrollLeft =
      (scrollContainer.scrollWidth - scrollContainer.clientWidth) / 2;
  }, []);

  const modelWinnerPicker: WinnerPicker = (slotA, slotB, availableTeams) => {
    const teamA = getTeamById(availableTeams, slotA);
    const teamB = getTeamById(availableTeams, slotB);
    return getRecommendedWinnerId(teamA, teamB, players);
  };

  const selectedMatch = selectedMatchId ? findMatch(selectedMatchId) : undefined;
  const selectedMatchState = selectedMatch ? bracketState[selectedMatch.id] ?? {} : undefined;
  const selectedPrediction = selectedMatchState
    ? getMatchupPrediction(
        getTeamById(teams, selectedMatchState.slotA),
        getTeamById(teams, selectedMatchState.slotB),
        players,
      )
    : null;

  const pickerMatch = pickerTarget ? findMatch(pickerTarget.matchId) : undefined;
  const pickerCandidates = useMemo(
    () =>
      pickerTarget
        ? getLegalSlotCandidates(
            bracketState,
            pickerTarget.matchId,
            pickerTarget.slotKey,
            teams,
          )
        : [],
    [bracketState, pickerTarget, teams],
  );

  const handleModelRecommendation = () => {
    setBracketState(createRecommendedBracketState(teams, modelWinnerPicker));
  };

  const handleChooseWinner = (matchId: string, teamId: string) => {
    setBracketState(
      chooseWinner(bracketState, matchId, teamId, teams, modelWinnerPicker),
    );
  };

  const handleSelectLegalTeam = (teamId: string) => {
    if (!pickerTarget) return;
    setBracketState(
      selectLegalSlotTeam(
        bracketState,
        pickerTarget.matchId,
        pickerTarget.slotKey,
        teamId,
        teams,
        modelWinnerPicker,
      ),
    );
    setSelectedMatchId(pickerTarget.matchId);
    setPickerTarget(undefined);
  };

  const jumpTo = (anchorId: string) => {
    const anchor = document.getElementById(anchorId);
    anchor?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });
    const scrollContainer = roadScrollRef.current;
    scrollContainer?.scrollTo({
      behavior: "smooth",
      left: (scrollContainer.scrollWidth - scrollContainer.clientWidth) / 2,
    });
  };

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-white/10 bg-[#07133f] p-4 shadow-[0_24px_80px_rgba(2,6,23,0.35)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-yellow-300">
              <LockKeyhole size={18} />
              <p className="text-xs font-black uppercase tracking-[0.18em]">
                {t("roadPathLocked")}
              </p>
            </div>
            <h2 className="mt-2 text-2xl font-black text-white">{t("roadInteractiveTitle")}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              {t("roadInteractiveDescription")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-yellow-300/30 bg-yellow-300/10 px-3 py-2 text-sm font-black text-yellow-100 hover:border-yellow-300"
              onClick={handleModelRecommendation}
              type="button"
            >
              <Sparkles size={16} />
              {t("useModelRecommendation")}
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10"
              onClick={handleModelRecommendation}
              type="button"
            >
              <RotateCcw size={16} />
              {t("resetPrediction")}
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-yellow-300 px-3 py-2 text-sm font-black text-[#07133f] hover:bg-yellow-200"
              onClick={() =>
                downloadJson("wc2026-championship-road.json", { bracketState })
              }
              type="button"
            >
              <Download size={16} />
              {t("exportJson")}
            </button>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:hidden">
          <button className="road-jump-button" onClick={() => jumpTo("road-top")} type="button">
            {t("roadUpperHalf")}
          </button>
          <button className="road-jump-button" onClick={() => jumpTo("road-final")} type="button">
            {t("stageFinal")}
          </button>
          <button className="road-jump-button" onClick={() => jumpTo("road-bottom")} type="button">
            {t("roadLowerHalf")}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-2">
            <MousePointerClick className="text-sky-300" size={15} />
            {t("roadClickBranchHint")}
          </span>
          <span className="inline-flex items-center gap-2">
            <LockKeyhole className="text-yellow-300" size={15} />
            {t("roadClickFlagHint")}
          </span>
        </div>
      </div>

      <div
        className="bracket-scroll overflow-x-auto rounded-lg border border-white/10 bg-[#030a2b] shadow-[0_30px_100px_rgba(2,6,23,0.45)]"
        ref={roadScrollRef}
      >
        <div className="min-w-[1280px]">
          <ChampionshipRoad
            bracketState={bracketState}
            onOpenTeamPicker={(matchId, slotKey) => setPickerTarget({ matchId, slotKey })}
            onSelectMatch={setSelectedMatchId}
            players={players}
            selectedMatchId={selectedMatchId}
            teams={teams}
          />
        </div>
      </div>

      {selectedMatch && selectedMatchState && (
        <BracketMatchDrawer
          match={selectedMatch}
          matchState={selectedMatchState}
          onChooseWinner={(teamId) => handleChooseWinner(selectedMatch.id, teamId)}
          onClose={() => setSelectedMatchId(undefined)}
          players={players}
          prediction={selectedPrediction}
          teams={teams}
        />
      )}

      {pickerTarget && pickerMatch && (
        <BracketTeamPicker
          candidates={pickerCandidates}
          currentTeamId={bracketState[pickerTarget.matchId]?.[pickerTarget.slotKey]}
          isUpstreamChoice={Boolean(
            findFeederMatch(pickerTarget.matchId, pickerTarget.slotKey),
          )}
          match={pickerMatch}
          onClose={() => setPickerTarget(undefined)}
          onSelect={handleSelectLegalTeam}
          slotKey={pickerTarget.slotKey}
        />
      )}
    </section>
  );
};
