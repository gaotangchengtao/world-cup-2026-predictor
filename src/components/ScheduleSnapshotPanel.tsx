import { CalendarDays, CheckCircle2, Clock3, MapPin } from "lucide-react";
import { tournamentSchedule, tournamentScheduleUpdatedAt } from "../data/tournamentSchedule";
import { useLanguage } from "../i18n";
import type { Team, TournamentFixture } from "../types/worldCup";
import { displayTeamName } from "../utils/localizedNames";
import { TeamFlag } from "./TeamFlag";

interface ScheduleSnapshotPanelProps {
  teams: Team[];
}

export const ScheduleSnapshotPanel = ({ teams }: ScheduleSnapshotPanelProps) => {
  const { language, t } = useLanguage();
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const completed = tournamentSchedule.filter((fixture) => fixture.status === "completed").slice(-6).reverse();
  const upcoming = tournamentSchedule.filter((fixture) => fixture.status !== "completed").slice(0, 5);

  return (
    <section className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
      <article className="glass-panel rounded-lg p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-trophy-300 light:text-trophy-700">
              {t("scheduleKicker")}
            </p>
            <h2 className="mt-1 text-xl font-black text-white light:text-slate-950">{t("schedulePanelTitle")}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300 light:text-slate-700">
              {t("schedulePanelDescription")}
            </p>
          </div>
          <CalendarDays className="text-trophy-300" size={24} />
        </div>
        <p className="mt-3 text-xs font-bold text-slate-400 light:text-slate-600">
          {t("scheduleUpdatedAt")}: {tournamentScheduleUpdatedAt}
        </p>
      </article>

      <article className="glass-panel rounded-lg p-3.5 sm:p-4">
        <h3 className="text-base font-black text-white light:text-slate-950">{t("upcomingMatches")}</h3>
        <div className="mt-3 grid gap-2">
          {upcoming.map((fixture) => (
            <FixtureRow fixture={fixture} key={fixture.id} teamById={teamById} />
          ))}
        </div>
      </article>

      <article className="glass-panel rounded-lg p-3.5 sm:p-4 lg:col-span-2">
        <h3 className="text-base font-black text-white light:text-slate-950">{t("completedMatches")}</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {completed.map((fixture) => (
            <FixtureRow fixture={fixture} key={fixture.id} teamById={teamById} />
          ))}
        </div>
      </article>
    </section>
  );
};

const FixtureRow = ({
  fixture,
  teamById,
}: {
  fixture: TournamentFixture;
  teamById: Map<string, Team>;
}) => {
  const { language, t } = useLanguage();
  const teamA = fixture.teamAId ? teamById.get(fixture.teamAId) : undefined;
  const teamB = fixture.teamBId ? teamById.get(fixture.teamBId) : undefined;
  const teamALabel = teamA ? displayTeamName(teamA, language) : fixture.teamALabel?.[language] ?? t("notSelected");
  const teamBLabel = teamB ? displayTeamName(teamB, language) : fixture.teamBLabel?.[language] ?? t("notSelected");
  const completed = fixture.status === "completed";

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 light:border-slate-900/10 light:bg-white">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-md bg-slate-950/45 px-2 py-1 text-xs font-black text-slate-300 light:bg-slate-100 light:text-slate-700">
          M{fixture.matchNumber} · {roundLabel(fixture.round, t)}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-black ${
            completed
              ? "bg-emerald-400/15 text-emerald-200 light:text-emerald-700"
              : "bg-trophy-400/15 text-trophy-200 light:text-trophy-800"
          }`}
        >
          {completed ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
          {completed ? t("completed") : fixture.status === "projected" ? t("projectedPath") : t("scheduled")}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <TeamLabel label={teamALabel} team={teamA} />
        <div className="rounded-md bg-slate-950/60 px-2.5 py-1 text-center text-sm font-black text-white light:bg-slate-100 light:text-slate-950">
          {completed ? `${fixture.teamAScore} - ${fixture.teamBScore}` : "vs"}
        </div>
        <TeamLabel align="right" label={teamBLabel} team={teamB} />
      </div>

      {fixture.penaltyScore && (
        <p className="mt-2 text-xs font-bold text-slate-400 light:text-slate-600">{fixture.penaltyScore}</p>
      )}
      <p className="mt-3 inline-flex items-center gap-1 text-xs text-slate-400 light:text-slate-600">
        <MapPin size={13} />
        {fixture.city} · {fixture.venue} · {fixture.date}
      </p>
    </div>
  );
};

const TeamLabel = ({
  align = "left",
  label,
  team,
}: {
  align?: "left" | "right";
  label: string;
  team?: Team;
}) => (
  <div className={`flex min-w-0 items-center gap-2 ${align === "right" ? "justify-end text-right" : ""}`}>
    {align === "left" && <TeamFlag team={team} size="sm" />}
    <span className="min-w-0 truncate text-sm font-black text-white light:text-slate-950">{label}</span>
    {align === "right" && <TeamFlag team={team} size="sm" />}
  </div>
);

const roundLabel = (round: string, t: ReturnType<typeof useLanguage>["t"]) => {
  if (round === "Round of 16") return t("stageRoundOf16");
  if (round === "Quarter-finals") return t("stageQuarterFinal");
  return round;
};
