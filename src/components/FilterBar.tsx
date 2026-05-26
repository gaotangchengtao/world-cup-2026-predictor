import { Search, SlidersHorizontal, Sparkles, Trophy } from "lucide-react";
import type { FilterState, GroupCode, PredictionStage } from "../types/worldCup";

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
  const update = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <section className="glass-panel rounded-lg p-4">
      <div className="grid gap-3 lg:grid-cols-[1.2fr_0.7fr_0.9fr_0.9fr]">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-trophy-500 light:border-slate-900/10 light:bg-white light:text-slate-950"
            onChange={(event) => update("query", event.target.value)}
            placeholder="搜索球队或国家名"
            value={filters.query}
          />
        </label>

        <select
          className="h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none focus:border-trophy-500 light:border-slate-900/10 light:bg-white light:text-slate-950"
          onChange={(event) => update("group", event.target.value as FilterState["group"])}
          value={filters.group}
        >
          {groups.map((group) => (
            <option key={group} value={group}>
              {group === "all" ? "全部小组" : `Group ${group}`}
            </option>
          ))}
        </select>

        <select
          className="h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none focus:border-trophy-500 light:border-slate-900/10 light:bg-white light:text-slate-950"
          onChange={(event) => update("stage", event.target.value as FilterState["stage"])}
          value={filters.stage}
        >
          {stages.map((stage) => (
            <option key={stage} value={stage}>
              {stage === "all" ? "全部预测阶段" : stage}
            </option>
          ))}
        </select>

        <select
          className="h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none focus:border-trophy-500 light:border-slate-900/10 light:bg-white light:text-slate-950"
          onChange={(event) => update("sortBy", event.target.value as FilterState["sortBy"])}
          value={filters.sortBy}
        >
          <option value="strengthRank">按实力排名</option>
          <option value="squadValue">按总身价</option>
          <option value="group">按小组</option>
          <option value="predictedStage">按预测阶段</option>
        </select>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
            filters.onlyContenders
              ? "border-trophy-500 bg-trophy-500 text-slate-950"
              : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 light:border-slate-900/10 light:text-slate-700"
          }`}
          onClick={() => update("onlyContenders", !filters.onlyContenders)}
          type="button"
        >
          <Trophy size={16} />
          只看冠军热门
        </button>
        <button
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
            filters.onlyDarkHorses
              ? "border-emerald-400 bg-emerald-400 text-slate-950"
              : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 light:border-slate-900/10 light:text-slate-700"
          }`}
          onClick={() => update("onlyDarkHorses", !filters.onlyDarkHorses)}
          type="button"
        >
          <Sparkles size={16} />
          只看黑马球队
        </button>
        <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100 light:border-slate-900/10 light:text-slate-700">
          <SlidersHorizontal size={16} />
          小组内排序
          <select
            className="bg-transparent text-sm outline-none"
            onChange={(event) => update("groupSortBy", event.target.value as FilterState["groupSortBy"])}
            value={filters.groupSortBy}
          >
            <option className="bg-slate-950" value="strengthRank">实力排名</option>
            <option className="bg-slate-950" value="predictedGroupPosition">预测组内名次</option>
          </select>
        </label>
      </div>
    </section>
  );
};
