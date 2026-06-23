import { Moon, Sun, Trophy } from "lucide-react";
import { useLanguage } from "../i18n";
import type { ExperienceMode } from "../types/worldCup";
import { ExperienceModeToggle } from "./ExperienceModeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface HeaderProps {
  experienceMode: ExperienceMode;
  mode: "overview" | "predictor";
  setExperienceMode: (mode: ExperienceMode) => void;
  setMode: (mode: "overview" | "predictor") => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
}

export const Header = ({ experienceMode, mode, setExperienceMode, setMode, theme, toggleTheme }: HeaderProps) => {
  const { t } = useLanguage();

  return (
    <header className="host-accent sticky top-0 z-30 border-b border-white/10 bg-[#04142f]/90 shadow-[0_18px_60px_rgba(0,12,34,0.28)] backdrop-blur-xl light:border-slate-900/10 light:bg-white/92">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 pb-3 pt-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <div className="host-brand-mark flex h-11 w-12 items-center justify-center rounded-lg text-white">
            <Trophy size={22} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-trophy-300 light:text-trophy-700">
              {t("predictorMvp")}
            </p>
            <h1 className="text-xl font-black text-white light:text-slate-950 sm:text-2xl">{t("appTitle")}</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-white/10 bg-white/5 p-1 light:border-slate-900/10 light:bg-slate-100">
            <button
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                mode === "overview"
                  ? "bg-trophy-500 text-slate-950"
                  : "text-slate-200 hover:bg-white/10 light:text-slate-700"
              }`}
              onClick={() => setMode("overview")}
              type="button"
            >
              {t("browseMode")}
            </button>
            <button
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                mode === "predictor"
                  ? "bg-trophy-500 text-slate-950"
                  : "text-slate-200 hover:bg-white/10 light:text-slate-700"
              }`}
              onClick={() => setMode("predictor")}
              type="button"
            >
              {t("predictorMode")}
            </button>
          </div>

          <ExperienceModeToggle experienceMode={experienceMode} setExperienceMode={setExperienceMode} />

          <LanguageSwitcher />

          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10 light:border-slate-900/10 light:bg-white light:text-slate-800"
            onClick={toggleTheme}
            title={theme === "dark" ? t("switchToLight") : t("switchToDark")}
            type="button"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
};
