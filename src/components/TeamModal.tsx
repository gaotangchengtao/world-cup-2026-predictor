import { ExternalLink, Search, Shield, Star, X } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { getTeamGuide } from "../data/teamGuides";
import { useLanguage } from "../i18n";
import type { ExperienceMode, Player, PlayerPosition, Team } from "../types/worldCup";
import { groupPositionLabel, playerPositionLabel, squadStatusLabel, stageLabel } from "../utils/format";
import { getBeginnerFriendlyRating, getTeamStyleTags, getTopTeamPlayers, type TeamStyleTag } from "../utils/insights";
import {
  displayClubName,
  displayCoachName,
  displayPlayerName,
  displayTeamName,
  playerSearchText,
} from "../utils/localizedNames";
import { getModelProfile } from "../utils/modelPredictions";
import { DataQualityBadge } from "./DataQualityBadge";
import { ExplanationCard } from "./ExplanationCard";
import { PlayerCard } from "./PlayerCard";
import { TeamStyleTags } from "./TeamStyleTags";
import { TeamFlag } from "./TeamFlag";

interface TeamModalProps {
  experienceMode: ExperienceMode;
  team: Team;
  players: Player[];
  onClose: () => void;
  onSelectPlayer: (player: Player) => void;
}

type ScoutTab = "overview" | "style" | "players" | "prediction" | "beginner" | "squad";

const positionLabels: Array<"all" | PlayerPosition> = ["all", "GK", "DF", "MF", "FW"];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const TeamModal = ({ experienceMode, team, players, onClose, onSelectPlayer }: TeamModalProps) => {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ScoutTab>("overview");
  const [position, setPosition] = useState<"all" | PlayerPosition>("all");
  const [club, setClub] = useState("all");
  const [query, setQuery] = useState("");
  const [sortByValue, setSortByValue] = useState(true);
  const [showFullSquad, setShowFullSquad] = useState(experienceMode === "expert");
  const teamName = displayTeamName(team, language);
  const styleTags = getTeamStyleTags(team);
  const beginnerRating = getBeginnerFriendlyRating(team, players);
  const totalValue = players.reduce((sum, player) => sum + player.marketValueEurM, 0);
  const keyPlayers = players.filter((player) => player.isKeyPlayer);
  const spotlightPlayers = getTopTeamPlayers(team.id, players, 5);
  const rosterStatus = squadStatusLabel(players.find((player) => player.squadStatus)?.squadStatus, t);
  const modelProfile = getModelProfile(team, players);
  const confidence = clamp(modelProfile.confidenceScore, 38, 94);

  const topPlayerNames = useMemo(
    () => spotlightPlayers.slice(0, 3).map((player) => displayPlayerName(player, language)),
    [language, spotlightPlayers],
  );

  const guide = useMemo(
    () => getTeamGuide({ team, language, teamName, playerNames: topPlayerNames }),
    [language, team, teamName, topPlayerNames],
  );

  const tabs: Array<{ id: ScoutTab; label: string }> = [
    { id: "overview", label: t("scoutTabOverview") },
    { id: "style", label: t("scoutTabStyle") },
    { id: "players", label: t("scoutTabKeyPlayers") },
    { id: "prediction", label: t("scoutTabPrediction") },
    { id: "beginner", label: t("scoutTabBeginner") },
    { id: "squad", label: t("scoutTabSquad") },
  ];

  const clubs = useMemo(() => ["all", ...Array.from(new Set(players.map((player) => player.club))).sort()], [players]);
  const localizedClubByName = useMemo(
    () => new Map(players.map((player) => [player.club, player.localizedClubZh])),
    [players],
  );

  const filteredPlayers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return players
      .filter((player) => showFullSquad || player.isKeyPlayer)
      .filter((player) => position === "all" || player.position === position)
      .filter((player) => club === "all" || player.club === club)
      .filter((player) => playerSearchText(player).includes(normalizedQuery))
      .sort((a, b) => (sortByValue ? b.marketValueEurM - a.marketValueEurM : a.position.localeCompare(b.position)));
  }, [club, players, position, query, showFullSquad, sortByValue]);

  const findPlayerByGuideName = (name: string) =>
    players.find((player) => player.name.toLowerCase() === name.toLowerCase());

  const whyWatchPlayer = (player: Player) => {
    if (language === "zh") {
      if (player.position === "GK") return "看他的扑救和出球是否能稳定球队节奏。";
      if (player.position === "DF") return "看他的防守站位、身体对抗和由守转攻第一脚。";
      if (player.position === "MF") return "看他如何连接防守和进攻，是理解球队节奏的入口。";
      return "看他的跑位、速度和最后一脚处理。";
    }

    if (player.position === "GK") return "Watch shot-stopping, distribution, and whether he calms the match down.";
    if (player.position === "DF") return "Watch positioning, duels, and the first pass after winning the ball.";
    if (player.position === "MF") return "Watch how he connects defense to attack and controls tempo.";
    return "Watch movement, pace, and final-third decision making.";
  };

  const predictionText = {
    reason:
      language === "zh"
        ? `${teamName} 的综合预测结合本届状态、人员可用性、战术适配、阵容默契、教练调整能力和近期加权历史表现。`
        : `${teamName}'s projection blends current tournament form, squad availability, tactical fit, role cohesion, coach adaptability, and recency-weighted history.`,
    upset:
      language === "zh"
        ? team.strengthRank <= 8
          ? "爆冷概率较低，但如果早早丢球或被高强度逼抢打乱节奏，仍然可能陷入麻烦。"
          : "有一定爆冷空间，尤其是在定位球、反击或门将超常发挥时。"
        : team.strengthRank <= 8
          ? "Upset risk is lower, but an early goal conceded or heavy pressing could still create trouble."
          : "There is upset upside, especially through set pieces, counters, or a standout goalkeeper performance.",
    scenario:
      language === "zh"
        ? "如果对手限制核心球员接球，并迫使边路低质量传中，预测路线会变得更脆弱。"
        : "If opponents deny the key creators and force low-quality wide deliveries, the route becomes more fragile.",
  };

  const attackText =
    language === "zh"
      ? styleTags.includes("possession")
        ? "倾向通过控球和短传建立优势。"
        : styleTags.includes("counter")
          ? "更擅长抢到球后快速推进。"
          : "进攻更依赖身体对抗、定位球和关键球员个人能力。"
      : styleTags.includes("possession")
        ? "They prefer to build advantages through possession and short passing."
        : styleTags.includes("counter")
          ? "They are dangerous when they win the ball and break quickly."
          : "Their attack leans more on physical duels, set pieces, and individual moments.";
  const defenseText =
    language === "zh"
      ? styleTags.includes("high-press")
        ? "防守会更主动，前场就开始压迫。"
        : "防守重点是保持阵型紧凑，减少禁区前沿空间。"
      : styleTags.includes("high-press")
        ? "Defensively they can be proactive and press high."
        : "The defensive priority is compact spacing and limiting central space.";
  const tempoText =
    language === "zh"
      ? styleTags.includes("possession")
        ? "节奏通常更耐心。"
        : "节奏更容易被转换进攻和身体对抗拉快。"
      : styleTags.includes("possession")
        ? "Tempo is usually more patient."
        : "Tempo can speed up through transitions and duels.";
  const riskLabel = {
    low: t("riskLow"),
    medium: t("riskMedium"),
    high: t("riskHigh"),
  }[modelProfile.upsetRisk];
  const styleLabel: Record<TeamStyleTag, string> = {
    possession: t("stylePossession"),
    counter: t("styleCounter"),
    physical: t("stylePhysical"),
    "defensive-counter": t("styleDefensiveCounter"),
    "high-press": t("styleHighPress"),
    "wing-backs": t("styleWingBacks"),
    youth: t("styleYouth"),
    giant: t("styleGiant"),
    tournament: t("styleTournament"),
    "dark-horse": t("styleDarkHorse"),
  };

  return (
    <div className="fixed inset-0 z-40 flex items-stretch justify-center bg-slate-950/75 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <article className="glass-panel h-[100dvh] max-h-[100dvh] w-full overflow-y-auto rounded-none p-4 pb-24 sm:h-auto sm:max-h-[94vh] sm:max-w-6xl sm:rounded-lg sm:p-5">
        <div className="sticky top-0 z-20 -mx-4 -mt-4 flex flex-col gap-4 border-b border-white/10 bg-slate-950/95 px-4 pb-4 pt-4 backdrop-blur light:border-slate-900/10 light:bg-white/95 sm:static sm:m-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-0 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <TeamFlag team={team} size="xl" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-trophy-300 light:text-trophy-700">
                {t("scoutReport")}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h2 className="text-3xl font-black text-white light:text-slate-950">{teamName}</h2>
                {team.isDarkHorse && (
                  <span className="rounded-md bg-orange-400/15 px-2 py-1 text-xs font-bold text-orange-200 light:text-orange-700">
                    {t("darkHorse")}
                  </span>
                )}
                <DataQualityBadge quality={team.dataQuality} />
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 light:text-slate-700">
                {guide.beginnerIntro}
              </p>
              <div className="mt-3">
                <TeamStyleTags team={team} />
              </div>
            </div>
          </div>
          <button
            className="self-end rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10 light:border-slate-900/10 light:text-slate-700 lg:self-start"
            onClick={onClose}
            title="Close team modal"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {experienceMode === "beginner" ? (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Metric label={t("beginnerFriendlyRating")} value={`${beginnerRating}/100`} hint={t("beginnerFriendlyHint")} tone="emerald" />
            <Metric label={t("predictedStage")} value={stageLabel(team.predictedStage, t)} />
            <Metric label={t("beginnerFocus")} value={styleTags.slice(0, 2).map((tag) => styleLabel[tag]).join(" / ")} />
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <Metric label={t("strengthRank")} value={`#${team.strengthRank}`} tone="trophy" />
            <Metric label={t("mlStrengthScore")} value={`${modelProfile.mlStrengthScore}`} hint={t("strengthScoreHint")} />
            <Metric
              label={t("currentTournamentForm")}
              value={`${modelProfile.tournamentFormScore ?? modelProfile.recentFormScore}`}
            />
            <Metric label={t("squadAvailability")} value={`${modelProfile.squadAvailabilityScore ?? 85}`} />
            <Metric label={t("squadStatus")} value={rosterStatus} />
            <Metric label={t("modelConfidence")} value={`${modelProfile.confidenceScore}/100`} />
          </div>
        )}

        <div className="sticky top-0 z-10 -mx-4 mt-5 overflow-x-auto border-b border-white/10 bg-slate-950/88 px-4 py-2 backdrop-blur light:border-slate-900/10 light:bg-white/90 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-0">
          <div className="flex min-w-max gap-2 rounded-lg border border-white/10 bg-slate-950/35 p-1 light:border-slate-900/10 light:bg-white/70">
            {tabs.map((tab) => (
              <button
                className={`rounded-md px-3 py-2 text-sm font-bold transition ${
                  activeTab === tab.id
                    ? "bg-trophy-500 text-slate-950 shadow-glow"
                    : "text-slate-300 hover:bg-white/10 light:text-slate-700"
                }`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "overview" && (
          <section className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Panel title={t("oneLineSummary")}>
              <p className="text-sm leading-6 text-slate-300 light:text-slate-700">
                {language === "zh" ? guide.beginnerIntro : team.description ?? guide.beginnerIntro}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Info label={t("coach")} value={displayCoachName(team.coach, language) || t("notAvailable")} />
                <Info label={t("formation")} value={team.formation ?? t("notAvailable")} />
                <Info label={t("predictedStage")} value={`${groupPositionLabel(team.predictedGroupPosition, t)} · ${stageLabel(team.predictedStage, t)}`} />
                <Info label={t("squadValue")} value={team.squadValue ?? `€${totalValue.toFixed(0)}m`} />
              </div>
            </Panel>
            <ExplanationCard players={players} team={team} compact={experienceMode === "beginner"} />
          </section>
        )}

        {activeTab === "style" && (
          <section className="mt-5 grid gap-4 lg:grid-cols-2">
            <Panel title={t("teamStyle")}>
              <p className="text-sm leading-6 text-slate-300 light:text-slate-700">{guide.playStyle}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Info label={t("attackingTraits")} value={attackText} />
                <Info label={t("defensiveTraits")} value={defenseText} />
                <Info label={t("matchTempo")} value={tempoText} />
              </div>
            </Panel>
            <Panel title={t("beginnerFocus")}>
              <p className="text-sm leading-6 text-slate-300 light:text-slate-700">
                {language === "zh"
                  ? `新手可以先看 ${teamName} 的核心球员如何拿球、什么时候加速，以及丢球后是否能快速回到阵型。`
                  : `New fans can watch how ${teamName}'s key players receive the ball, when the team accelerates, and how quickly the shape resets after losing it.`}
              </p>
            </Panel>
          </section>
        )}

        {activeTab === "players" && (
          <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {spotlightPlayers.map((player) => (
              <button
                className="rounded-lg border border-white/10 bg-slate-950/45 p-4 text-left transition hover:border-trophy-500 light:border-slate-900/10 light:bg-white"
                key={player.playerId}
                onClick={() => onSelectPlayer(player)}
                type="button"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {playerPositionLabel(player.position, t)}
                </p>
                <p className="mt-2 text-lg font-black text-white light:text-slate-950">{displayPlayerName(player, language)}</p>
                <p className="mt-1 text-sm text-slate-400 light:text-slate-600">
                  {displayClubName(player.club, language, player.localizedClubZh)}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300 light:text-slate-700">
                  <span className="font-bold text-trophy-300 light:text-trophy-700">{t("whyWatchPlayer")}: </span>
                  {whyWatchPlayer(player)}
                </p>
              </button>
            ))}
          </section>
        )}

        {activeTab === "prediction" && (
          <section className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <Panel title={t("predictionReason")}>
              <p className="text-sm leading-6 text-slate-300 light:text-slate-700">{predictionText.reason}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ScoreMeter label={t("mlStrengthScore")} value={modelProfile.mlStrengthScore} tone="trophy" />
                <ScoreMeter
                  label={t("currentTournamentForm")}
                  value={modelProfile.tournamentFormScore ?? modelProfile.recentFormScore}
                  tone="sky"
                />
                <ScoreMeter label={t("attackTrend")} value={modelProfile.attackTrend} tone="emerald" />
                <ScoreMeter label={t("defenseTrend")} value={modelProfile.defenseTrend} tone="orange" />
                <ScoreMeter
                  label={t("squadAvailability")}
                  value={modelProfile.squadAvailabilityScore ?? 85}
                  tone="emerald"
                />
                <ScoreMeter label={t("tacticalFit")} value={modelProfile.tacticalFitScore ?? 80} tone="sky" />
                <ScoreMeter label={t("playerFit")} value={modelProfile.playerFitScore ?? 80} tone="emerald" />
                <ScoreMeter
                  label={t("currentSquadSignal")}
                  value={modelProfile.currentSquadSignalScore ?? 55}
                  tone="sky"
                />
                <ScoreMeter label={t("squadCohesion")} value={modelProfile.squadCohesionScore ?? 80} tone="trophy" />
                <ScoreMeter
                  label={t("coachAdaptability")}
                  value={modelProfile.coachAdaptabilityScore ?? 80}
                  tone="orange"
                />
              </div>
              {((language === "zh" ? modelProfile.keyAbsencesZh : modelProfile.keyAbsences)?.length
                || (language === "zh" ? modelProfile.tacticalNotesZh : modelProfile.tacticalNotes)?.length) && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {Boolean((language === "zh" ? modelProfile.keyAbsencesZh : modelProfile.keyAbsences)?.length) && (
                    <div className="rounded-lg border border-orange-400/20 bg-orange-500/10 p-3">
                      <p className="text-xs font-black uppercase text-orange-200 light:text-orange-700">
                        {t("keyAbsences")}
                      </p>
                      <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-300 light:text-slate-700">
                        {(language === "zh" ? modelProfile.keyAbsencesZh : modelProfile.keyAbsences)?.map((item) => (
                          <li key={item}>- {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Boolean((language === "zh" ? modelProfile.tacticalNotesZh : modelProfile.tacticalNotes)?.length) && (
                    <div className="rounded-lg border border-sky-400/20 bg-sky-500/10 p-3">
                      <p className="text-xs font-black uppercase text-sky-200 light:text-sky-700">
                        {t("tacticalNotes")}
                      </p>
                      <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-300 light:text-slate-700">
                        {(language === "zh" ? modelProfile.tacticalNotesZh : modelProfile.tacticalNotes)?.map((item) => (
                          <li key={item}>- {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-4 rounded-lg border border-trophy-500/20 bg-trophy-500/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-white light:text-slate-950">{t("modelConfidence")}</p>
                  <span className="rounded-md bg-slate-950/70 px-2 py-1 text-xs font-black text-trophy-300 light:bg-white">
                    {riskLabel}
                  </span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-900/70 light:bg-slate-200">
                  <div className="h-full rounded-full bg-trophy-400" style={{ width: `${confidence}%` }} />
                </div>
                <p className="mt-1 text-sm font-black text-trophy-300 light:text-trophy-700">{confidence}/100</p>
              </div>
            </Panel>
            <Panel title={t("strengthsAndRisks")}>
              <div className="grid gap-4 md:grid-cols-2">
                <ListBlock title={t("keyAdvantages")} tone="emerald" items={guide.keyStrengths} />
                <ListBlock title={t("mainRisks")} tone="orange" items={guide.weaknesses} />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300 light:text-slate-700">
                <span className="font-bold text-orange-300 light:text-orange-700">{t("upsetPossibility")}: </span>
                {predictionText.upset}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300 light:text-slate-700">
                <span className="font-bold text-sky-300 light:text-sky-700">{t("upsetScenario")}: </span>
                {predictionText.scenario}
              </p>
            </Panel>
          </section>
        )}

        {activeTab === "beginner" && (
          <section className="mt-5 grid gap-4 lg:grid-cols-2">
            <Panel title={t("beginnerGuide")}>
              <p className="text-sm leading-6 text-slate-300 light:text-slate-700">{guide.whyTheyMatter}</p>
              <div className="mt-4">
                <h4 className="text-sm font-black text-trophy-200 light:text-trophy-800">{t("playersToWatch")}</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {guide.playersToWatch.map((name) => {
                    const player = findPlayerByGuideName(name);
                    return player ? (
                      <button
                        className="rounded-md border border-trophy-500/30 bg-slate-950/35 px-2 py-1 text-xs font-bold text-trophy-200 transition hover:border-trophy-400 hover:bg-trophy-500/20 light:bg-white light:text-trophy-800"
                        key={player.playerId}
                        onClick={() => onSelectPlayer(player)}
                        type="button"
                      >
                        {displayPlayerName(player, language)}
                      </button>
                    ) : (
                      <span className="rounded-md border border-white/10 px-2 py-1 text-xs font-bold text-slate-200 light:border-slate-900/10 light:text-slate-700" key={name}>
                        {name}
                      </span>
                    );
                  })}
                </div>
              </div>
            </Panel>
            <Panel title={t("historicalNote")}>
              <p className="text-sm leading-6 text-slate-300 light:text-slate-700">{guide.historicalNote}</p>
            </Panel>
          </section>
        )}

        {activeTab === "squad" && (
          <section className="mt-5 rounded-lg border border-white/10 bg-white/5 p-4 light:border-slate-900/10 light:bg-slate-50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-white light:text-slate-950">{t("playerList")}</h3>
                <p className="text-xs text-slate-400 light:text-slate-600">
                  {t("squadStatus")}: {rosterStatus} · {t("dataQuality")}: <DataQualityBadge quality={team.dataQuality} compact />
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10 light:border-slate-900/10 light:text-slate-700"
                  onClick={() => setShowFullSquad(!showFullSquad)}
                  type="button"
                >
                  {showFullSquad ? t("showKeyPlayersOnly") : t("showFullSquad")}
                </button>
                {team.sourceUrls[0] && (
                  <a
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/10 light:border-slate-900/10 light:text-slate-700"
                    href={team.sourceUrls[0]}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {t("dataSource")}
                    <ExternalLink size={15} />
                  </a>
                )}
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-trophy-500/20 bg-trophy-500/10 p-3 text-sm leading-6 text-slate-200 light:text-slate-800">
              {t("squadStatusNote")} {t("finalSquadUpdateNote")}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_0.7fr_0.7fr_auto]">
              <label className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                <input
                  className="h-10 w-full rounded-lg border border-white/10 bg-slate-950/60 pl-9 pr-3 text-sm text-white outline-none focus:border-trophy-500 light:border-slate-900/10 light:bg-white light:text-slate-950"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("searchPlayers")}
                  value={query}
                />
              </label>
              <select
                className="h-10 rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm text-white outline-none focus:border-trophy-500 light:border-slate-900/10 light:bg-white light:text-slate-950"
                onChange={(event) => setPosition(event.target.value as "all" | PlayerPosition)}
                value={position}
              >
                {positionLabels.map((item) => (
                  <option key={item} value={item}>
                    {item === "all" ? t("allPositions") : playerPositionLabel(item, t)}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm text-white outline-none focus:border-trophy-500 light:border-slate-900/10 light:bg-white light:text-slate-950"
                onChange={(event) => setClub(event.target.value)}
                value={club}
              >
                {clubs.map((item) => (
                  <option key={item} value={item}>
                    {item === "all"
                      ? t("allClubs")
                      : displayClubName(item, language, localizedClubByName.get(item))}
                  </option>
                ))}
              </select>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-trophy-500 px-3 text-sm font-black text-slate-950 hover:bg-trophy-300"
                onClick={() => setSortByValue(!sortByValue)}
                type="button"
              >
                <Shield size={15} />
                {sortByValue ? t("sortByMarketValue") : t("sortByPosition")}
              </button>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {filteredPlayers.map((player) => (
                <PlayerCard key={player.playerId} player={player} onSelect={onSelectPlayer} />
              ))}
            </div>

            {filteredPlayers.length === 0 && (
              <p className="mt-4 rounded-lg border border-white/10 p-4 text-sm text-slate-400 light:border-slate-900/10 light:text-slate-600">
                {t("noPlayers")}
              </p>
            )}
          </section>
        )}

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-slate-950/92 p-3 backdrop-blur light:border-slate-900/10 light:bg-white/95 sm:hidden">
          <div className="mx-auto grid max-w-lg grid-cols-3 gap-2">
            <button
              className="rounded-lg border border-white/10 px-3 py-3 text-xs font-black text-slate-200 light:border-slate-900/10 light:text-slate-700"
              onClick={onClose}
              type="button"
            >
              {t("close")}
            </button>
            <button
              className="rounded-lg border border-trophy-500/30 bg-trophy-500/10 px-3 py-3 text-xs font-black text-trophy-100 light:text-trophy-800"
              onClick={() => setActiveTab("squad")}
              type="button"
            >
              {t("scoutTabSquad")}
            </button>
            <button
              className="rounded-lg bg-trophy-500 px-3 py-3 text-xs font-black text-slate-950"
              onClick={() => {
                setActiveTab("squad");
                setShowFullSquad((current) => !current);
              }}
              type="button"
            >
              {showFullSquad ? t("showKeyPlayersOnly") : t("showFullSquad")}
            </button>
          </div>
        </div>
      </article>
    </div>
  );
};

const Metric = ({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "trophy" | "emerald" }) => (
  <div className={`rounded-lg border p-4 ${
    tone === "trophy"
      ? "border-trophy-500/30 bg-trophy-500/10"
      : tone === "emerald"
        ? "border-emerald-400/30 bg-emerald-500/10"
        : "border-white/10 bg-white/5 light:border-slate-900/10 light:bg-slate-50"
  }`}>
    <p className="text-xs uppercase text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-black text-white light:text-slate-950">{value}</p>
    {hint && <p className="mt-2 text-xs leading-5 text-slate-400 light:text-slate-600">{hint}</p>}
  </div>
);

const Panel = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="rounded-lg border border-white/10 bg-white/5 p-4 light:border-slate-900/10 light:bg-white">
    <h3 className="text-lg font-black text-white light:text-slate-950">{title}</h3>
    <div className="mt-3">{children}</div>
  </section>
);

const ScoreMeter = ({ label, value, tone }: { label: string; value: number; tone: "trophy" | "sky" | "emerald" | "orange" }) => {
  const color =
    tone === "trophy"
      ? "bg-trophy-400"
      : tone === "sky"
        ? "bg-sky-400"
        : tone === "emerald"
          ? "bg-emerald-400"
          : "bg-orange-400";

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 light:border-slate-900/10 light:bg-white">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <p className="text-sm font-black text-white light:text-slate-950">{value}</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-900/70 light:bg-slate-200">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-white/10 bg-slate-950/35 p-3 light:border-slate-900/10 light:bg-slate-50">
    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
    <p className="mt-1 text-sm font-black text-white light:text-slate-950">{value}</p>
  </div>
);

const ListBlock = ({ title, items, tone }: { title: string; items: string[]; tone: "emerald" | "orange" }) => (
  <div>
    <h4 className={`text-sm font-black ${tone === "emerald" ? "text-emerald-300 light:text-emerald-700" : "text-orange-300 light:text-orange-700"}`}>
      {title}
    </h4>
    <ul className="mt-2 space-y-1 text-sm text-slate-300 light:text-slate-700">
      {items.map((item) => (
        <li className="flex gap-2" key={item}>
          <span className={tone === "emerald" ? "text-emerald-300" : "text-orange-300"}>-</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);
