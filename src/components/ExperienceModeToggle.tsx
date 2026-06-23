import { GraduationCap, SlidersHorizontal } from "lucide-react";
import { useLanguage } from "../i18n";
import type { ExperienceMode } from "../types/worldCup";

interface ExperienceModeToggleProps {
  compact?: boolean;
  experienceMode: ExperienceMode;
  setExperienceMode: (mode: ExperienceMode) => void;
}

export const ExperienceModeToggle = ({ compact = false, experienceMode, setExperienceMode }: ExperienceModeToggleProps) => {
  const { t } = useLanguage();

  return (
    <div className={`flex rounded-lg border border-white/10 bg-slate-950/35 p-1 light:border-slate-900/10 light:bg-slate-100 ${compact ? "w-full sm:w-auto" : ""}`}>
      <button
        className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold transition ${
          compact ? "min-w-0 flex-1 whitespace-nowrap px-1.5 text-[11px] sm:flex-none sm:px-3 sm:text-sm" : ""
        } ${
          experienceMode === "beginner"
            ? "bg-emerald-400 text-slate-950 shadow-[0_0_22px_rgba(52,211,153,0.28)]"
            : "text-slate-200 hover:bg-white/10 light:text-slate-700"
        }`}
        onClick={() => setExperienceMode("beginner")}
        type="button"
      >
        <GraduationCap className={compact ? "hidden sm:block" : ""} size={15} />
        <span>
          {t("beginnerMode")}
          <span className="hidden text-[11px] font-bold opacity-75 xl:block">{t("beginnerModeHint")}</span>
        </span>
      </button>
      <button
        className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold transition ${
          compact ? "min-w-0 flex-1 whitespace-nowrap px-1.5 text-[11px] sm:flex-none sm:px-3 sm:text-sm" : ""
        } ${
          experienceMode === "expert"
            ? "bg-sky-400 text-slate-950 shadow-[0_0_22px_rgba(56,189,248,0.28)]"
            : "text-slate-200 hover:bg-white/10 light:text-slate-700"
        }`}
        onClick={() => setExperienceMode("expert")}
        type="button"
      >
        <SlidersHorizontal className={compact ? "hidden sm:block" : ""} size={15} />
        <span>
          {t("expertMode")}
          <span className="hidden text-[11px] font-bold opacity-75 xl:block">{t("expertModeHint")}</span>
        </span>
      </button>
    </div>
  );
};
