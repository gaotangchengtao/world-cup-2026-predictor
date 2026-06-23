import type {
  Player,
  PlayerAvailabilityStatus,
  PlayerPosition,
} from "../types/worldCup";
import marketValueSnapshot from "./marketValues.json";
import officialSquadSnapshot from "./officialSquads.json";

interface OfficialSquadPlayer {
  playerId: string;
  fifaId?: number;
  teamId: string;
  name: string;
  nameZh?: string;
  position: PlayerPosition;
  dateOfBirth: string;
  age: number;
  club: string;
  clubZh?: string;
  heightCm?: number;
  internationalCaps?: number;
  internationalGoals?: number;
  shirtNumber: number;
  photoUrl?: string | null;
}

const avatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0d1c36&color=f8fafc&bold=true&size=192`;

const transfermarktSearchUrl = (name: string) =>
  `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(name)}`;

const squadSourceUrls = [
  officialSquadSnapshot.sourceUrl,
  officialSquadSnapshot.statsSourceUrl,
];

export const players: Player[] = (officialSquadSnapshot.players as OfficialSquadPlayer[]).map((row) => {
  const verifiedValue =
    marketValueSnapshot.players[row.name as keyof typeof marketValueSnapshot.players];
  const availability =
    marketValueSnapshot.availability[
      row.name as keyof typeof marketValueSnapshot.availability
    ] as
      | { status: PlayerAvailabilityStatus; note: string; noteZh: string }
      | undefined;
  const marketValueEurM = typeof verifiedValue === "number" ? verifiedValue : 0;
  const isKeyPlayer =
    marketValueEurM >= 80 ||
    (row.internationalGoals ?? 0) >= 20 ||
    (row.internationalCaps ?? 0) >= 75;

  return {
    playerId: row.playerId,
    fifaId: row.fifaId,
    teamId: row.teamId,
    name: row.name,
    localizedNameZh: row.nameZh,
    photoUrl: row.photoUrl ?? avatarUrl(row.name),
    photoSource: row.photoUrl ? "fifa" : "placeholder",
    photoCredit: row.photoUrl
      ? "FIFA tournament player image"
      : "Generated placeholder avatar from player initials",
    photoLastUpdated: officialSquadSnapshot.updatedAt.slice(0, 10),
    position: row.position,
    dateOfBirth: row.dateOfBirth,
    age: row.age,
    club: row.club,
    localizedClubZh: row.clubZh,
    heightCm: row.heightCm,
    internationalCaps: row.internationalCaps,
    internationalGoals: row.internationalGoals,
    marketValue: typeof verifiedValue === "number" ? `€${verifiedValue.toFixed(2)}m` : undefined,
    marketValueEurM,
    marketValueLastUpdated: marketValueSnapshot.updatedAt,
    marketValueSourceUrl: marketValueSnapshot.sourceUrl,
    marketValueStatus: typeof verifiedValue === "number" ? "verified" : "stale",
    transfermarktUrl: transfermarktSearchUrl(row.name),
    availabilityStatus: availability?.status ?? "available",
    availabilityNote: availability?.note,
    availabilityNoteZh: availability?.noteZh,
    isKeyPlayer,
    predictedStarter: row.shirtNumber <= 11 || isKeyPlayer,
    shirtNumber: row.shirtNumber,
    squadStatus: "final",
    lastUpdated: officialSquadSnapshot.updatedAt,
    sourceUrls: squadSourceUrls,
    dataQuality: "official",
  };
});
