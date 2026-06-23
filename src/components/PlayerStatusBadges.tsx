import { AlertTriangle, BadgeCheck, Clock3, HeartPulse } from "lucide-react";
import { useLanguage } from "../i18n";
import type { MarketValueStatus, PlayerAvailabilityStatus } from "../types/worldCup";

interface PlayerStatusBadgesProps {
  availabilityStatus?: PlayerAvailabilityStatus;
  compact?: boolean;
  marketValueStatus?: MarketValueStatus;
}

const marketTone: Record<MarketValueStatus, string> = {
  verified: "border-emerald-400/30 bg-emerald-400/12 text-emerald-200 light:text-emerald-700",
  estimated: "border-blue-400/30 bg-blue-400/12 text-blue-200 light:text-blue-700",
  stale: "border-slate-400/30 bg-slate-400/12 text-slate-300 light:text-slate-700",
};

const availabilityTone: Record<PlayerAvailabilityStatus, string> = {
  available: "border-emerald-400/30 bg-emerald-400/12 text-emerald-200 light:text-emerald-700",
  doubtful: "border-amber-400/30 bg-amber-400/12 text-amber-200 light:text-amber-700",
  injured: "border-red-400/30 bg-red-400/12 text-red-200 light:text-red-700",
  "not-selected": "border-slate-400/30 bg-slate-400/12 text-slate-300 light:text-slate-700",
};

export const PlayerStatusBadges = ({
  availabilityStatus = "available",
  compact = false,
  marketValueStatus = "estimated",
}: PlayerStatusBadgesProps) => {
  const { t } = useLanguage();
  const MarketIcon = marketValueStatus === "verified" ? BadgeCheck : Clock3;
  const AvailabilityIcon = availabilityStatus === "available" ? BadgeCheck : availabilityStatus === "doubtful" ? AlertTriangle : HeartPulse;
  const marketLabel =
    marketValueStatus === "verified"
      ? t("marketValueVerified")
      : marketValueStatus === "stale"
        ? t("marketValueStale")
        : t("marketValueEstimated");
  const availabilityLabel =
    availabilityStatus === "available"
      ? t("availabilityAvailable")
      : availabilityStatus === "doubtful"
        ? t("availabilityDoubtful")
        : availabilityStatus === "injured"
          ? t("availabilityInjured")
          : t("availabilityNotSelected");

  return (
    <div className="flex flex-wrap gap-1.5">
      <span
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 font-bold ${marketTone[marketValueStatus]} ${
          compact ? "text-[10px]" : "text-xs"
        }`}
      >
        <MarketIcon size={compact ? 11 : 13} />
        {marketLabel}
      </span>
      {availabilityStatus !== "available" && (
        <span
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 font-bold ${availabilityTone[availabilityStatus]} ${
            compact ? "text-[10px]" : "text-xs"
          }`}
        >
          <AvailabilityIcon size={compact ? 11 : 13} />
          {availabilityLabel}
        </span>
      )}
    </div>
  );
};
