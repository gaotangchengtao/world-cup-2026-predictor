import { useLanguage } from "../i18n";
import type { DataQuality } from "../types/worldCup";
import { qualityLabel } from "../utils/format";

interface DataQualityBadgeProps {
  quality: DataQuality;
  compact?: boolean;
}

const toneByQuality: Record<DataQuality, string> = {
  official: "border-emerald-400/30 bg-emerald-500/15 text-emerald-200 light:text-emerald-700",
  "official-placeholder": "border-teal-400/30 bg-teal-500/15 text-teal-200 light:text-teal-700",
  estimated: "border-sky-400/30 bg-sky-500/15 text-sky-200 light:text-sky-700",
  projected: "border-trophy-400/30 bg-trophy-500/15 text-trophy-200 light:text-trophy-700",
  mock: "border-slate-400/25 bg-slate-500/15 text-slate-300 light:text-slate-600",
  manual: "border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-200 light:text-fuchsia-700",
};

export const DataQualityBadge = ({ quality, compact = false }: DataQualityBadgeProps) => {
  const { t } = useLanguage();

  return (
    <span
      className={`inline-flex items-center rounded-md border font-bold ${toneByQuality[quality]} ${
        compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
      }`}
      title={t("dataQualityTooltip")}
    >
      {qualityLabel(quality, t)}
    </span>
  );
};
