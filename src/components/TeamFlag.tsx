import { useState } from "react";
import type { Team } from "../types/worldCup";
import { getFlagImageUrl } from "../utils/flags";

interface TeamFlagProps {
  team?: Team;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-5 w-7",
  md: "h-7 w-10",
  lg: "h-10 w-14",
  xl: "h-14 w-20",
};

const emojiClasses = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-4xl",
  xl: "text-5xl",
};

export const TeamFlag = ({ team, size = "md" }: TeamFlagProps) => {
  const [failed, setFailed] = useState(false);
  const imageUrl = getFlagImageUrl(team);

  if (team && imageUrl && !failed) {
    return (
      <img
        alt={`${team.name} flag`}
        className={`${sizeClasses[size]} shrink-0 rounded-sm object-cover ring-1 ring-white/15`}
        loading="lazy"
        onError={() => setFailed(true)}
        src={imageUrl}
      />
    );
  }

  return <span className={`${emojiClasses[size]} shrink-0 leading-none`}>{team?.flag ?? "🏳️"}</span>;
};
