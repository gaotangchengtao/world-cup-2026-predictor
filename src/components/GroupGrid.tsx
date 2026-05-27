import type { ExperienceMode, FilterState, Team, WorldCupGroup } from "../types/worldCup";
import { useLanguage } from "../i18n";
import { GroupCard } from "./GroupCard";

interface GroupGridProps {
  groups: WorldCupGroup[];
  teams: Team[];
  filters: FilterState;
  experienceMode: ExperienceMode;
  onSelectTeam: (team: Team) => void;
}

export const GroupGrid = ({ groups, teams, filters, experienceMode, onSelectTeam }: GroupGridProps) => {
  const { t } = useLanguage();
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const visibleGroups = groups.filter((group) => filters.group === "all" || group.code === filters.group);

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {visibleGroups.map((group) => {
        const groupTeams = group.teamIds
          .map((teamId) => teamById.get(teamId))
          .filter((team): team is Team => Boolean(team))
          .filter((team) => teams.some((visibleTeam) => visibleTeam.id === team.id))
          .sort((a, b) =>
            filters.groupSortBy === "predictedGroupPosition"
              ? a.predictedGroupPosition - b.predictedGroupPosition
              : a.strengthRank - b.strengthRank,
          );

        if (groupTeams.length === 0) return null;

        return (
          <GroupCard
            key={group.code}
            groupName={`${t("group")} ${group.code}`}
            teams={groupTeams}
            experienceMode={experienceMode}
            onSelectTeam={onSelectTeam}
          />
        );
      })}
    </section>
  );
};
