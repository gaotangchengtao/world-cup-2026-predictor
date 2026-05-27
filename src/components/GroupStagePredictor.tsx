import { Download, RotateCcw, Table2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { defaultGroupStagePredictions } from "../data/groupStagePredictions";
import { useLanguage } from "../i18n";
import type { GroupCode, GroupStagePredictionState, Team, WorldCupGroup } from "../types/worldCup";
import { downloadJson } from "../utils/format";
import { calculateGroupStandings, createGroupMatches, qualificationKey } from "../utils/groupStage";
import { displayTeamName } from "../utils/localizedNames";
import { readJson, storageKeys, writeJson } from "../utils/storage";
import { TeamFlag } from "./TeamFlag";

interface GroupStagePredictorProps {
  groups: WorldCupGroup[];
  teams: Team[];
}

const scoreValue = (value: string) => {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(0, Math.min(99, Math.floor(parsed)));
};

const readInitialPredictions = () => {
  const saved = readJson(storageKeys.groupStagePredictions, {} as GroupStagePredictionState);
  return Object.keys(saved).length > 0 ? saved : defaultGroupStagePredictions;
};

export const GroupStagePredictor = ({ groups, teams }: GroupStagePredictorProps) => {
  const { language, t } = useLanguage();
  const [selectedGroup, setSelectedGroup] = useState<"all" | GroupCode>("all");
  const [predictions, setPredictions] = useState<GroupStagePredictionState>(readInitialPredictions);

  const matches = useMemo(() => createGroupMatches(groups), [groups]);
  const teamById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);
  const visibleGroups = selectedGroup === "all" ? groups : groups.filter((group) => group.code === selectedGroup);
  const completedMatchCount = matches.filter(
    (match) =>
      typeof predictions[match.id]?.homeScore === "number" &&
      typeof predictions[match.id]?.awayScore === "number",
  ).length;

  useEffect(() => {
    writeJson(storageKeys.groupStagePredictions, predictions);
  }, [predictions]);

  const updateScore = (matchId: string, side: "homeScore" | "awayScore", value: string) => {
    setPredictions((current) => ({
      ...current,
      [matchId]: {
        ...current[matchId],
        [side]: scoreValue(value),
      },
    }));
  };

  return (
    <section className="glass-panel rounded-lg p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Table2 className="text-trophy-300" size={22} />
            <h2 className="text-xl font-black text-white light:text-slate-950">{t("groupStagePredictorTitle")}</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 light:text-slate-600">
            {t("groupStagePredictorDescription")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10 light:border-slate-900/10 light:text-slate-700"
            onClick={() => setPredictions(defaultGroupStagePredictions)}
            type="button"
          >
            <RotateCcw size={16} />
            {t("resetGroupStage")}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-trophy-500 px-3 py-2 text-sm font-black text-slate-950 hover:bg-trophy-300"
            onClick={() =>
              downloadJson("wc2026-group-stage-prediction.json", {
                groupStagePredictions: predictions,
                completedMatches: completedMatchCount,
                generatedAt: new Date().toISOString(),
              })
            }
            type="button"
          >
            <Download size={16} />
            {t("exportGroupStageJson")}
          </button>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <button
          className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-bold transition ${
            selectedGroup === "all"
              ? "border-trophy-500 bg-trophy-500 text-slate-950"
              : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 light:border-slate-900/10 light:text-slate-700"
          }`}
          onClick={() => setSelectedGroup("all")}
          type="button"
        >
          {t("allGroupsScoreboard")}
        </button>
        {groups.map((group) => (
          <button
            className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-bold transition ${
              selectedGroup === group.code
                ? "border-trophy-500 bg-trophy-500 text-slate-950"
                : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 light:border-slate-900/10 light:text-slate-700"
            }`}
            key={group.code}
            onClick={() => setSelectedGroup(group.code)}
            type="button"
          >
            {t("group")} {group.code}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {visibleGroups.map((group) => {
          const groupMatches = matches.filter((match) => match.group === group.code);
          const standings = calculateGroupStandings(group, teams, matches, predictions);

          return (
            <article
              className="rounded-lg border border-white/10 bg-slate-950/45 p-4 light:border-slate-900/10 light:bg-white/80"
              key={group.code}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-black text-white light:text-slate-950">
                  {t("group")} {group.code}
                </h3>
                <span className="rounded-md bg-white/5 px-2 py-1 text-xs font-bold text-slate-300 light:bg-slate-100 light:text-slate-600">
                  {groupMatches.filter((match) => predictions[match.id]?.homeScore !== undefined && predictions[match.id]?.awayScore !== undefined).length}/6
                </span>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-black text-trophy-200 light:text-trophy-800">{t("groupMatchScores")}</h4>
                <div className="mt-2 grid gap-2">
                  {groupMatches.map((match) => {
                    const homeTeam = teamById.get(match.homeTeamId);
                    const awayTeam = teamById.get(match.awayTeamId);
                    const score = predictions[match.id] ?? {};

                    return (
                      <div
                        className="grid gap-2 rounded-lg border border-white/10 bg-white/5 p-2 light:border-slate-900/10 light:bg-slate-50 sm:grid-cols-[1fr_auto_1fr]"
                        key={match.id}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <TeamFlag team={homeTeam} size="sm" />
                          <span className="truncate text-sm font-bold text-white light:text-slate-950">
                            {displayTeamName(homeTeam, language)}
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <input
                            aria-label={`${displayTeamName(homeTeam, language)} ${t("score")}`}
                            className="h-9 w-14 rounded-md border border-white/10 bg-slate-950/70 text-center text-sm font-black text-white outline-none focus:border-trophy-500 light:border-slate-900/10 light:bg-white light:text-slate-950"
                            min={0}
                            onChange={(event) => updateScore(match.id, "homeScore", event.target.value)}
                            type="number"
                            value={score.homeScore ?? ""}
                          />
                          <span className="text-xs font-black text-slate-500">-</span>
                          <input
                            aria-label={`${displayTeamName(awayTeam, language)} ${t("score")}`}
                            className="h-9 w-14 rounded-md border border-white/10 bg-slate-950/70 text-center text-sm font-black text-white outline-none focus:border-trophy-500 light:border-slate-900/10 light:bg-white light:text-slate-950"
                            min={0}
                            onChange={(event) => updateScore(match.id, "awayScore", event.target.value)}
                            type="number"
                            value={score.awayScore ?? ""}
                          />
                        </div>
                        <div className="flex min-w-0 items-center justify-end gap-2">
                          <span className="truncate text-sm font-bold text-white light:text-slate-950">
                            {displayTeamName(awayTeam, language)}
                          </span>
                          <TeamFlag team={awayTeam} size="sm" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-black text-trophy-200 light:text-trophy-800">{t("groupStandings")}</h4>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-xs">
                    <thead className="text-slate-500">
                      <tr>
                        <th className="py-2 pr-2">#</th>
                        <th className="py-2 pr-2">{t("teamDetails")}</th>
                        <th className="py-2 pr-2">{t("playedShort")}</th>
                        <th className="py-2 pr-2">{t("winsShort")}</th>
                        <th className="py-2 pr-2">{t("drawsShort")}</th>
                        <th className="py-2 pr-2">{t("lossesShort")}</th>
                        <th className="py-2 pr-2">{t("goalsForShort")}</th>
                        <th className="py-2 pr-2">{t("goalsAgainstShort")}</th>
                        <th className="py-2 pr-2">{t("goalDifferenceShort")}</th>
                        <th className="py-2 pr-2">{t("pointsShort")}</th>
                        <th className="py-2 pr-2">{t("qualification")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((row) => {
                        const team = teamById.get(row.teamId);

                        return (
                          <tr className="border-t border-white/10 light:border-slate-900/10" key={row.teamId}>
                            <td className="py-2 pr-2 font-black text-trophy-300 light:text-trophy-700">
                              {row.position}
                            </td>
                            <td className="py-2 pr-2">
                              <div className="flex items-center gap-2">
                                <TeamFlag team={team} size="sm" />
                                <span className="font-bold text-white light:text-slate-950">
                                  {displayTeamName(team, language)}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 pr-2 text-slate-300 light:text-slate-700">{row.played}</td>
                            <td className="py-2 pr-2 text-slate-300 light:text-slate-700">{row.wins}</td>
                            <td className="py-2 pr-2 text-slate-300 light:text-slate-700">{row.draws}</td>
                            <td className="py-2 pr-2 text-slate-300 light:text-slate-700">{row.losses}</td>
                            <td className="py-2 pr-2 text-slate-300 light:text-slate-700">{row.goalsFor}</td>
                            <td className="py-2 pr-2 text-slate-300 light:text-slate-700">{row.goalsAgainst}</td>
                            <td className="py-2 pr-2 text-slate-300 light:text-slate-700">
                              {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                            </td>
                            <td className="py-2 pr-2 text-sm font-black text-white light:text-slate-950">{row.points}</td>
                            <td className="py-2 pr-2">
                              <span className="rounded-md bg-emerald-400/15 px-2 py-1 font-bold text-emerald-200 light:text-emerald-700">
                                {t(qualificationKey(row.position))}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
