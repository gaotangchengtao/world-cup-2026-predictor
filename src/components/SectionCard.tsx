import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { useLanguage } from "../i18n";
import type { OverviewSection } from "../types/worldCup";

interface SectionCardProps {
  active?: boolean;
  description: string;
  icon: ReactNode;
  onSelect: (section: OverviewSection) => void;
  section: OverviewSection;
  tags: string[];
  title: string;
}

export const SectionCard = ({ active = false, description, icon, onSelect, section, tags, title }: SectionCardProps) => {
  const { t } = useLanguage();

  return (
    <button
      className={`group flex h-full flex-col rounded-lg border p-4 text-left transition ${
        active
          ? "border-trophy-500 bg-trophy-500/15 shadow-glow"
          : "border-white/10 bg-white/5 hover:border-trophy-500/70 hover:bg-white/10 light:border-slate-900/10 light:bg-white light:hover:border-trophy-500"
      }`}
      onClick={() => onSelect(section)}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg ${
            active ? "bg-trophy-500 text-slate-950" : "bg-slate-950/60 text-trophy-300 light:bg-slate-100"
          }`}
        >
          {icon}
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-400 transition group-hover:text-trophy-300 light:text-slate-500">
          {t("overviewOpenSection")}
          <ArrowRight size={14} />
        </span>
      </div>
      <h3 className="mt-4 text-lg font-black text-white light:text-slate-950">{title}</h3>
      <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-300 light:text-slate-700">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            className="rounded-full border border-white/10 bg-slate-950/45 px-2.5 py-1 text-xs font-semibold text-slate-300 light:border-slate-900/10 light:bg-slate-100 light:text-slate-700"
            key={tag}
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
};
