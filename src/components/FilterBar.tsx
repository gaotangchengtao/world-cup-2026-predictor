import { Search, SlidersHorizontal, Sparkles, Trophy } from "lucide-react";
import { useLanguage } from "../i18n";
import type { FilterState, GroupCode, PredictionStage } from "../types/worldCup";
import { stageLabel } from "../utils/format";

const groups: Array<"all" | GroupCode> = ["all", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

const stages: Array<"all" | PredictionStage> = [
  "all",
  "Champion",
  "Final",
  "Semi-final",
  "Quarter-final",
  "Round of 16",
  "Round of 32",
  "Group Stage",
];

interface FilterBarProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
}

export const FilterBar = ({ filters, setFilters }: FilterBarProps) => {
  const { t } = useLanguage();
  const update = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <section className="glass-panel rounded-lg p-3.5 sm:p-4">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-[1.2fr_0.7fr_0.9fr_0.9fr]">
        <label className="relative col-span-2 block lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-trophy-500 light:border-slate-900/10 light:bg-white light:text-slate-950"
            onChange={(event) => update("query", event.target.value)}
            placeholder={t("searchTeams")}
            value={filters.query}
          />
        </label>

        <select
          className="h-11 min-w-0 rounded-lg border border-white/10 bg-slate-950/70 px-2.5 text-xs text-white outline-none focus:border-trophy-500 light:border-slate-900/10 light:bg-white light:text-slate-950 sm:px-3 sm:text-sm"
          onChange={(event) => update("group", event.target.value as FilterState["group"])}
          value={filters.group}
        >
          {groups.map((group) => (
            <option key={group} value={group}>
              {group === "all" ? t("allGroups") : `${t("group")} ${group}`}
            </option>
          ))}
        </select>

        <select
          className="h-11 min-w-0 rounded-lg border border-white/10 bg-slate-950/70 px-2.5 text-xs text-white outline-none focus:border-trophy-500 light:border-slate-900/10 light:bg-white light:text-slate-950 sm:px-3 sm:text-sm"
          onChange={(event) => update("stage", event.target.value as FilterState["stage"])}
          value={filters.stage}
        >
          {stages.map((stage) => (
            <option key={stage} value={stage}>
              {stage === "all" ? t("allStages") : stageLabel(stage, t)}
            </option>
          ))}
        </select>

        <select
          className="col-span-2 h-11 min-w-0 rounded-lg border border-white/10 bg-slate-950/70 px-2.5 text-xs text-white outline-none focus:border-trophy-500 light:border-slate-900/10 light:bg-white light:text-slate-950 sm:px-3 sm:text-sm lg:col-span-1"
          onChange={(event) => update("sortBy", event.target.value as FilterState["sortBy"])}
          value={filters.sortBy}
        >
          <option value="strengthRank">{t("sortByStrengthRank")}</option>
          <option value="squadValue">{t("sortBySquadValue")}</option>
          <option value="group">{t("sortByGroup")}</option>
          <option value="predictedStage">{t("sortByPredictedStage")}</option>
        </select>
      </div>

      <div className="mobile-inline-list mt-3 flex items-center gap-2 overflow-x-auto pb-1">
        <button
          className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition sm:text-sm ${
            filters.onlyContenders
              ? "border-trophy-500 bg-trophy-500 text-slate-950"
              : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 light:border-slate-900/10 light:text-slate-700"
          }`}
          onClick={() => update("onlyContenders", !filters.onlyContenders)}
          type="button"
        >
          <Trophy size={16} />
          {t("onlyContenders")}
        </button>
        <button
          className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition sm:text-sm ${
            filters.onlyDarkHorses
              ? "border-emerald-400 bg-emerald-400 text-slate-950"
              : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 light:border-slate-900/10 light:text-slate-700"
          }`}
          onClick={() => update("onlyDarkHorses", !filters.onlyDarkHorses)}
          type="button"
        >
          <Sparkles size={16} />
          {t("onlyDarkHorses")}
        </button>
        <label className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 light:border-slate-900/10 light:text-slate-700 sm:text-sm">
          <SlidersHorizontal size={16} />
          {t("groupSort")}
          <select
            className="bg-transparent text-sm outline-none"
            onChange={(event) => update("groupSortBy", event.target.value as FilterState["groupSortBy"])}
            value={filters.groupSortBy}
          >
            <option className="bg-slate-950" value="strengthRank">
              {t("strengthRank")}
            </option>
            <option className="bg-slate-950" value="predictedGroupPosition">
              {t("predictedGroupPosition")}
            </option>
          </select>
        </label>
      </div>
    </section>
  );
};
