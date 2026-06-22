import { LockKeyhole, X } from "lucide-react";
import { useEffect } from "react";
import { useLanguage } from "../i18n";
import type { BracketMatch, Team } from "../types/worldCup";
import { groupPositionLabel } from "../utils/format";
import { displayTeamName } from "../utils/localizedNames";
import { TeamFlag } from "./TeamFlag";

interface BracketTeamPickerProps {
  match: BracketMatch;
  slotKey: "slotA" | "slotB";
  candidates: Team[];
  currentTeamId?: string;
  isUpstreamChoice: boolean;
  onSelect: (teamId: string) => void;
  onClose: () => void;
}

export const BracketTeamPicker = ({
  match,
  slotKey,
  candidates,
  currentTeamId,
  isUpstreamChoice,
  onSelect,
  onClose,
}: BracketTeamPickerProps) => {
  const { language, t } = useLanguage();
  const bracketSlot = match[slotKey];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <section className="w-full rounded-t-lg border border-white/10 bg-[#07133f] p-4 shadow-2xl sm:max-w-lg sm:rounded-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-yellow-300">
              <LockKeyhole size={17} />
              <p className="text-xs font-black uppercase tracking-[0.16em]">{t("roadLegalCandidates")}</p>
            </div>
            <h3 className="mt-2 text-xl font-black text-white">
              {t("match")} {match.matchNumber} · {bracketSlot.label}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {isUpstreamChoice ? t("roadUpstreamRule") : t("roadGroupSourceRule")}
            </p>
          </div>
          <button
            className="rounded-md border border-white/10 p-2 text-slate-300 hover:bg-white/10"
            onClick={onClose}
            title={t("close")}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {candidates.map((team) => {
            const isCurrent = team.id === currentTeamId;
            return (
              <button
                className={`flex min-w-0 items-center gap-3 rounded-lg border p-3 text-left transition ${
                  isCurrent
                    ? "border-yellow-300 bg-yellow-300/10"
                    : "border-white/10 bg-white/5 hover:border-sky-300/60 hover:bg-white/10"
                }`}
                key={team.id}
                onClick={() => onSelect(team.id)}
                type="button"
              >
                <TeamFlag team={team} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-white">
                    {displayTeamName(team, language)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {t("group")} {team.group} · {groupPositionLabel(team.predictedGroupPosition, t)} · #{team.strengthRank}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {candidates.length === 0 && (
          <p className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            {t("roadNoLegalCandidates")}
          </p>
        )}
      </section>
    </div>
  );
};
