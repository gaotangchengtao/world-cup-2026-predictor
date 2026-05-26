import type { Team } from "../types/worldCup";
import { TeamCard } from "./TeamCard";

interface GroupCardProps {
  groupName: string;
  teams: Team[];
  onSelectTeam: (team: Team) => void;
}

export const GroupCard = ({ groupName, teams, onSelectTeam }: GroupCardProps) => (
  <article className="glass-panel rounded-lg p-4">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-black text-white light:text-slate-950">{groupName}</h2>
      <span className="rounded-md border border-white/10 px-2 py-1 text-xs font-bold text-slate-300 light:border-slate-900/10 light:text-slate-600">
        {teams.length}/4
      </span>
    </div>
    <div className="grid gap-3">
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} onSelect={onSelectTeam} />
      ))}
    </div>
  </article>
);
