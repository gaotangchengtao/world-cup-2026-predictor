import { useLanguage, type TranslationKey } from "../i18n";
import type { Team } from "../types/worldCup";
import { getTeamStyleTags, type TeamStyleTag } from "../utils/insights";

interface TeamStyleTagsProps {
  team: Team;
}

const labelKey: Record<TeamStyleTag, TranslationKey> = {
  possession: "stylePossession",
  counter: "styleCounter",
  physical: "stylePhysical",
  "defensive-counter": "styleDefensiveCounter",
  "high-press": "styleHighPress",
  "wing-backs": "styleWingBacks",
  youth: "styleYouth",
  giant: "styleGiant",
  tournament: "styleTournament",
  "dark-horse": "styleDarkHorse",
};

export const TeamStyleTags = ({ team }: TeamStyleTagsProps) => {
  const { t } = useLanguage();
  const tags = getTeamStyleTags(team);

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          className="rounded-full border border-trophy-500/30 bg-trophy-500/10 px-3 py-1 text-xs font-bold text-trophy-100 light:text-trophy-800"
          key={tag}
        >
          {t(labelKey[tag])}
        </span>
      ))}
    </div>
  );
};
