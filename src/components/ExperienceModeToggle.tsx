import { GraduationCap, SlidersHorizontal } from "lucide-react";
import { useLanguage } from "../i18n";
import type { ExperienceMode } from "../types/worldCup";

interface ExperienceModeToggleProps {
  experienceMode: ExperienceMode;
  setExperienceMode: (mode: ExperienceMode) => void;
}

export const ExperienceModeToggle = ({ experienceMode, setExperienceMode }: ExperienceModeToggleProps) => {
  const { t } = useLanguage();

  return (
    <div className="flex rounded-lg border border-white/10 bg-white/5 p-1 light:border-slate-900/10 light:bg-slate-100">
      <button
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition ${
          experienceMode === "beginner"
            ? "bg-emerald-400 text-slate-950"
            : "text-slate-200 hover:bg-white/10 light:text-slate-700"
        }`}
        onClick={() => setExperienceMode("beginner")}
        type="button"
      >
        <GraduationCap size={15} />
        {t("beginnerMode")}
      </button>
      <button
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition ${
          experienceMode === "expert"
            ? "bg-sky-400 text-slate-950"
            : "text-slate-200 hover:bg-white/10 light:text-slate-700"
        }`}
        onClick={() => setExperienceMode("expert")}
        type="button"
      >
        <SlidersHorizontal size={15} />
        {t("expertMode")}
      </button>
    </div>
  );
};
