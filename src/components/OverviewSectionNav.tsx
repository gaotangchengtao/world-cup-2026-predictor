import { Database, GitBranch, GraduationCap, LayoutDashboard, Newspaper, Shield, Users } from "lucide-react";
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
  { id: "stories", titleKey: "overviewStories", descriptionKey: "overviewStoriesDesc", icon: Newspaper },
  { id: "data", titleKey: "overviewData", descriptionKey: "overviewDataDesc", icon: Database },
];

interface OverviewSectionNavProps {
  activeSection: OverviewSection;
  setActiveSection: (section: OverviewSection) => void;
}

export const OverviewSectionNav = ({ activeSection, setActiveSection }: OverviewSectionNavProps) => {
  const { t } = useLanguage();
  const activeTone: Record<OverviewSection, string> = {
    home: "bg-host-navy text-white",
    groups: "bg-host-green text-white",
    knockout: "bg-host-maple text-white",
    players: "bg-host-blue text-white",
    beginner: "bg-host-green text-white",
    stories: "bg-host-red text-white",
    data: "bg-host-navy text-white",
  };

  return (
    <nav className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label={t("browseMode")}>
      <div className="host-accent flex min-w-max gap-1.5 rounded-lg border border-white/10 bg-[#04142f]/70 p-1.5 light:border-slate-900/10 light:bg-white/80 lg:min-w-0">
        {overviewSectionMeta.map((section) => {
          const Icon = section.icon;
          const active = section.id === activeSection;

          return (
            <button
              className={`inline-flex min-w-[148px] items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-bold transition lg:min-w-0 lg:flex-1 ${
                active
                  ? `${activeTone[section.id]} shadow-[0_8px_24px_rgba(0,40,104,0.2)]`
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
