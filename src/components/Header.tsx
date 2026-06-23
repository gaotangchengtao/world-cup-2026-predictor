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
    <header className="host-accent sticky top-0 z-30 min-h-[125px] border-b border-white/10 bg-[#04142f]/90 shadow-[0_18px_60px_rgba(0,12,34,0.28)] backdrop-blur-xl light:border-slate-900/10 light:bg-white/92 sm:min-h-0">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-3 pb-2.5 pt-3 sm:gap-4 sm:px-6 sm:pb-3 sm:pt-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="host-brand-mark flex h-9 w-10 shrink-0 items-center justify-center rounded-lg text-white sm:h-11 sm:w-12">
              <Trophy size={20} />
            </div>
            <div className="min-w-0">
              <p className="hidden text-xs uppercase text-trophy-300 light:text-trophy-700 sm:block">
                {t("predictorMvp")}
              </p>
              <h1 className="truncate text-base font-black text-white light:text-slate-950 sm:text-2xl">{t("appTitle")}</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:hidden">
            <LanguageSwitcher compact />
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-100 light:border-slate-900/10 light:bg-white light:text-slate-800"
              onClick={toggleTheme}
              title={theme === "dark" ? t("switchToLight") : t("switchToDark")}
              type="button"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <div className="flex w-full rounded-lg border border-white/10 bg-white/5 p-1 light:border-slate-900/10 light:bg-slate-100 sm:w-auto">
            <button
              className={`min-w-0 flex-1 rounded-md px-2 py-2 text-xs font-semibold transition sm:flex-none sm:px-4 sm:text-sm ${
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
              className={`min-w-0 flex-1 rounded-md px-2 py-2 text-xs font-semibold transition sm:flex-none sm:px-4 sm:text-sm ${
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

          <ExperienceModeToggle compact experienceMode={experienceMode} setExperienceMode={setExperienceMode} />

          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          <button
            className="hidden h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10 light:border-slate-900/10 light:bg-white light:text-slate-800 sm:inline-flex"
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
