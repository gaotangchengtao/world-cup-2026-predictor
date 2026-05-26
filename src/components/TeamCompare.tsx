import { Scale } from "lucide-react";
import { useMemo, useState } from "react";
import { useLanguage } from "../i18n";
import type { Player, Team } from "../types/worldCup";
import { stageLabel } from "../utils/format";
import { displayTeamName } from "../utils/localizedNames";
import { TeamFlag } from "./TeamFlag";

interface TeamCompareProps {
  teams: Team[];
  players: Player[];
}

export const TeamCompare = ({ teams, players }: TeamCompareProps) => {
  const { language, t } = useLanguage();
  const sortedTeams = useMemo(() => [...teams].sort((a, b) => a.strengthRank - b.strengthRank), [teams]);
  const [leftId, setLeftId] = useState(sortedTeams[0]?.id ?? "");
  const [rightId, setRightId] = useState(sortedTeams[1]?.id ?? "");
  const left = teams.find((team) => team.id === leftId);
  const right = teams.find((team) => team.id === rightId);

  const metrics = (team?: Team) => {
    const teamPlayers = players.filter((player) => player.teamId === team?.id);
    return {
      value: team?.squadValue ?? "N/A",
      core: teamPlayers.filter((player) => player.isKeyPlayer).length,
      starters: teamPlayers.filter((player) => player.predictedStarter).length,
    };
  };

  const leftMetrics = metrics(left);
  const rightMetrics = metrics(right);

  return (
    <section className="glass-panel rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white light:text-slate-950">{t("teamCompare")}</h2>
          <p className="text-sm text-slate-400 light:text-slate-600">{t("teamCompareDescription")}</p>
        </div>
        <Scale className="text-trophy-300" size={22} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {[
          { value: leftId, setValue: setLeftId },
          { value: rightId, setValue: setRightId },
        ].map((select, index) => (
          <select
            className="h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none focus:border-trophy-500 light:border-slate-900/10 light:bg-white light:text-slate-950"
            key={index}
            onChange={(event) => select.setValue(event.target.value)}
            value={select.value}
          >
            {sortedTeams.map((team) => (
              <option key={team.id} value={team.id}>
                #{team.strengthRank} {displayTeamName(team, language)}
              </option>
            ))}
          </select>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {[
          { team: left, metrics: leftMetrics },
          { team: right, metrics: rightMetrics },
        ].map(({ team, metrics }, index) => (
          <article
            className="rounded-lg border border-white/10 bg-white/5 p-4 light:border-slate-900/10 light:bg-white"
            key={team?.id ?? index}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex min-w-0 items-center gap-2 text-xl font-black text-white light:text-slate-950">
                <TeamFlag team={team} size="md" />
                <span className="truncate">{displayTeamName(team, language) || "N/A"}</span>
              </h3>
              <span className="rounded-md bg-slate-950 px-2 py-1 text-xs font-black text-trophy-300 light:bg-slate-900">
                #{team?.strengthRank ?? "-"}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-500">{t("strengthScore")}</dt>
                <dd className="font-black text-white light:text-slate-950">{team?.strengthScore ?? "N/A"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("squadValue")}</dt>
                <dd className="font-black text-white light:text-slate-950">{metrics.value}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("corePlayers")}</dt>
                <dd className="font-black text-white light:text-slate-950">{metrics.core}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("starterSample")}</dt>
                <dd className="font-black text-white light:text-slate-950">{metrics.starters}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500">{t("predictedStage")}</dt>
                <dd className="font-black text-white light:text-slate-950">
                  {team ? stageLabel(team.predictedStage, t) : "N/A"}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
};
