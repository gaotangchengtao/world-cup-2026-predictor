import { Eye, HelpCircle, ShieldQuestion } from "lucide-react";
import { useLanguage } from "../i18n";
import type { ExperienceMode, Player, Team } from "../types/worldCup";
import { displayPlayerName, displayTeamName } from "../utils/localizedNames";
import { TeamFlag } from "./TeamFlag";

type MatchImportance = "must-watch" | "interesting" | "tactical" | "upset-watch";

type MatchWatchingGuideItem = {
  id: string;
  title: string;
  teamAId: string;
  teamBId: string;
  importance: MatchImportance;
  beginnerSummary: string;
  expertSummary: string;
  keyQuestions: string[];
  playersToWatch: string[];
  tacticalFocus: string[];
};

interface MatchWatchingGuideProps {
  experienceMode: ExperienceMode;
  players: Player[];
  teams: Team[];
}

const guides: MatchWatchingGuideItem[] = [
  {
    id: "brazil-france",
    title: "Brazil vs France",
    teamAId: "brazil",
    teamBId: "france",
    importance: "must-watch",
    beginnerSummary: "看 Brazil 的边路个人突破，也看 France 抢到球之后能不能几脚传球就打到禁区。",
    expertSummary: "重点是边路 1v1、转换进攻速度，以及两队中卫身后的保护距离。",
    keyQuestions: ["哪队先控制中场？", "Brazil 能否持续制造单挑？", "France 的反击第一脚是否足够干净？"],
    playersToWatch: ["Vinícius Júnior", "Raphinha", "Kylian Mbappé", "William Saliba"],
    tacticalFocus: ["边路 1v1", "转换进攻", "防线身后空间"],
  },
  {
    id: "spain-uruguay",
    title: "Spain vs Uruguay",
    teamAId: "spain",
    teamBId: "uruguay",
    importance: "tactical",
    beginnerSummary: "这场适合看传控球队遇到高强度逼抢时，会不会被打乱节奏。",
    expertSummary: "Spain 的控球结构要面对 Uruguay 的中场压迫和纵向冲击。",
    keyQuestions: ["Spain 能否把球传出压力区？", "Uruguay 的逼抢会不会留下身后空当？", "谁能赢下二点球？"],
    playersToWatch: ["Lamine Yamal", "Pedri", "Federico Valverde", "Darwin Núñez"],
    tacticalFocus: ["控球耐心", "高位逼抢", "二点球争夺"],
  },
  {
    id: "england-croatia",
    title: "England vs Croatia",
    teamAId: "england",
    teamBId: "croatia",
    importance: "interesting",
    beginnerSummary: "看 England 的明星攻击线怎么配合，也看 Croatia 老练中场如何慢下来控制节奏。",
    expertSummary: "这是速度、身体和技术控场之间的对比，关键在中场接应和禁区前沿处理。",
    keyQuestions: ["England 能不能把天赋转成稳定机会？", "Croatia 能否拖慢比赛？", "定位球会不会改变局势？"],
    playersToWatch: ["Jude Bellingham", "Bukayo Saka", "Luka Modrić", "Joško Gvardiol"],
    tacticalFocus: ["前场轮转", "中场控节奏", "定位球"],
  },
  {
    id: "usa-morocco",
    title: "USA vs Morocco",
    teamAId: "usa",
    teamBId: "morocco",
    importance: "upset-watch",
    beginnerSummary: "这场适合看黑马球队：谁更能守住阵型，谁更能用速度打出突然袭击。",
    expertSummary: "USA 的压迫和 Morocco 的防守反击都很鲜明，胜负可能来自边后卫身后的空间。",
    keyQuestions: ["哪队先犯下出球失误？", "边路推进能否形成连续威胁？", "门将能否扑出关键球？"],
    playersToWatch: ["Christian Pulisic", "Antonee Robinson", "Achraf Hakimi", "Yassine Bounou"],
    tacticalFocus: ["压迫触发点", "边路推进", "防守反击"],
  },
];

const importanceLabel = (importance: MatchImportance, t: ReturnType<typeof useLanguage>["t"]) => {
  const labels = {
    "must-watch": "mustWatch",
    interesting: "interestingMatch",
    tactical: "tacticalMatch",
    "upset-watch": "upsetWatch",
  } as const;

  return t(labels[importance]);
};

export const MatchWatchingGuide = ({ experienceMode, players, teams }: MatchWatchingGuideProps) => {
  const { language, t } = useLanguage();
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const playerByName = new Map(players.map((player) => [player.name, player]));

  return (
    <section className="glass-panel rounded-lg p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-400 text-slate-950">
          <Eye size={22} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300 light:text-sky-700">
            {t("matchGuideTitle")}
          </p>
          <h2 className="mt-1 text-2xl font-black text-white light:text-slate-950">{t("matchGuideTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300 light:text-slate-700">{t("matchGuideDescription")}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {guides.map((guide) => {
          const teamA = teamById.get(guide.teamAId);
          const teamB = teamById.get(guide.teamBId);

          return (
            <article
              className="rounded-lg border border-white/10 bg-slate-950/45 p-4 light:border-slate-900/10 light:bg-white"
              key={guide.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <TeamFlag team={teamA} size="sm" />
                  <span className="font-black text-white light:text-slate-950">{teamA ? displayTeamName(teamA, language) : guide.teamAId}</span>
                  <span className="text-slate-500">vs</span>
                  <TeamFlag team={teamB} size="sm" />
                  <span className="font-black text-white light:text-slate-950">{teamB ? displayTeamName(teamB, language) : guide.teamBId}</span>
                </div>
                <span className="rounded-md bg-trophy-500/15 px-2 py-1 text-xs font-bold text-trophy-300 light:text-trophy-700">
                  {importanceLabel(guide.importance, t)}
                </span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300 light:text-emerald-700">
                    {t("beginnerSummary")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300 light:text-slate-700">{guide.beginnerSummary}</p>
                </div>
                {experienceMode === "expert" && (
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-300 light:text-sky-700">
                      {t("expertSummary")}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300 light:text-slate-700">{guide.expertSummary}</p>
                  </div>
                )}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="inline-flex items-center gap-1 text-sm font-black text-white light:text-slate-950">
                    <HelpCircle size={15} />
                    {t("keyQuestions")}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-300 light:text-slate-700">
                    {guide.keyQuestions.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="inline-flex items-center gap-1 text-sm font-black text-white light:text-slate-950">
                    <ShieldQuestion size={15} />
                    {t("tacticalFocus")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {guide.tacticalFocus.map((item) => (
                      <span className="rounded-md bg-white/5 px-2 py-1 text-xs font-bold text-slate-300 light:bg-slate-100 light:text-slate-700" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {guide.playersToWatch.map((name) => {
                  const player = playerByName.get(name);
                  return (
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-bold text-slate-200 light:border-slate-900/10 light:text-slate-700" key={name}>
                      {player ? displayPlayerName(player, language) : name}
                    </span>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
