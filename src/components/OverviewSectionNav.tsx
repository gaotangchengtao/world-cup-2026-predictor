import { Database, GitBranch, GraduationCap, LayoutDashboard, Shield, Users } from "lucide-react";
import { useLanguage, type TranslationKey } from "../i18n";
import type { OverviewSection } from "../types/worldCup";

export const overviewSectionMeta: Array<{
  descriptionKey: TranslationKey;
  id: OverviewSection;
  icon: typeof LayoutDashboard;
  titleKey: TranslationKey;
}> = [
  { id: "home", titleKey: "overviewHome", descriptionKey: "overviewHomeDesc", icon: LayoutDashboard },
  { id: "groups", titleKey: "overviewGroups", descriptionKey: "overviewGroupsDesc", icon: Shield },
  { id: "knockout", titleKey: "overviewKnockout", descriptionKey: "overviewKnockoutDesc", icon: GitBranch },
  { id: "players", titleKey: "overviewPlayers", descriptionKey: "overviewPlayersDesc", icon: Users },
  { id: "beginner", titleKey: "overviewBeginner", descriptionKey: "overviewBeginnerDesc", icon: GraduationCap },
  { id: "data", titleKey: "overviewData", descriptionKey: "overviewDataDesc", icon: Database },
];

interface OverviewSectionNavProps {
  activeSection: OverviewSection;
  setActiveSection: (section: OverviewSection) => void;
}

export const OverviewSectionNav = ({ activeSection, setActiveSection }: OverviewSectionNavProps) => {
  const { t } = useLanguage();

  return (
    <nav className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label={t("browseMode")}>
      <div className="flex min-w-max gap-2 rounded-lg border border-white/10 bg-slate-950/35 p-1 light:border-slate-900/10 light:bg-white/70 lg:min-w-0">
        {overviewSectionMeta.map((section) => {
          const Icon = section.icon;
          const active = section.id === activeSection;

          return (
            <button
              className={`inline-flex min-w-[148px] items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-bold transition lg:min-w-0 lg:flex-1 ${
                active
                  ? "bg-trophy-500 text-slate-950 shadow-glow"
                  : "text-slate-300 hover:bg-white/10 light:text-slate-700"
              }`}
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              type="button"
            >
              <Icon size={16} />
              <span className="whitespace-nowrap">{t(section.titleKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
