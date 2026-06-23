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
  const tones: Record<OverviewSection, { border: string; icon: string; tag: string }> = {
    home: {
      border: "hover:border-blue-400/70",
      icon: "bg-blue-500/15 text-blue-200 light:text-blue-700",
      tag: "border-blue-400/20 bg-blue-500/10",
    },
    groups: {
      border: "hover:border-emerald-400/70",
      icon: "bg-emerald-500/15 text-emerald-200 light:text-emerald-700",
      tag: "border-emerald-400/20 bg-emerald-500/10",
    },
    knockout: {
      border: "hover:border-red-400/70",
      icon: "bg-red-500/15 text-red-200 light:text-red-700",
      tag: "border-red-400/20 bg-red-500/10",
    },
    players: {
      border: "hover:border-cyan-400/70",
      icon: "bg-cyan-500/15 text-cyan-200 light:text-cyan-700",
      tag: "border-cyan-400/20 bg-cyan-500/10",
    },
    beginner: {
      border: "hover:border-emerald-400/70",
      icon: "bg-emerald-500/15 text-emerald-200 light:text-emerald-700",
      tag: "border-emerald-400/20 bg-emerald-500/10",
    },
    stories: {
      border: "hover:border-red-400/70",
      icon: "bg-red-500/15 text-red-200 light:text-red-700",
      tag: "border-red-400/20 bg-red-500/10",
    },
    data: {
      border: "hover:border-blue-400/70",
      icon: "bg-blue-500/15 text-blue-200 light:text-blue-700",
      tag: "border-blue-400/20 bg-blue-500/10",
    },
  };
  const tone = tones[section];

  return (
    <button
      className={`dashboard-card group flex h-full flex-col rounded-lg border p-4 text-left ${
        active
          ? "border-trophy-500 bg-trophy-500/15 shadow-glow"
          : `border-white/10 bg-white/5 hover:bg-white/10 light:border-slate-900/10 light:bg-white ${tone.border}`
      }`}
      onClick={() => onSelect(section)}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg ${
            active ? "bg-trophy-500 text-white" : tone.icon
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
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold text-slate-300 light:text-slate-700 ${tone.tag}`}
            key={tag}
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
};
