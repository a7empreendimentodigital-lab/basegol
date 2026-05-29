import { prisma } from "@/lib/prisma";
import type { LineupRole } from "@prisma/client";
import { getMatchAthletesForSide } from "@/services/operator.service";

export type LineupEntryDto = {
  id: string;
  athleteId: string;
  name: string;
  role: LineupRole;
  shirtNumber: number | null;
  photoUrl: string | null;
  position: string | null;
};

export type TeamLineupDto = {
  teamId: string;
  clubName: string;
  entries: LineupEntryDto[];
  availableAthletes: { id: string; label: string; shirtNumber: number | null }[];
};

export async function getMatchLineupBoard(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: { include: { club: true } },
      awayTeam: { include: { club: true } },
      lineups: {
        include: {
          athlete: true,
        },
      },
    },
  });
  if (!match) return null;

  const mapEntries = (teamId: string): LineupEntryDto[] =>
    match.lineups
      .filter((l) => l.teamId === teamId)
      .map((l) => ({
        id: l.id,
        athleteId: l.athleteId,
        name: `${l.athlete.firstName} ${l.athlete.lastName}`,
        role: l.role,
        shirtNumber: l.shirtNumber ?? l.athlete.shirtNumber,
        photoUrl: l.athlete.photoUrl,
        position: l.position ?? l.athlete.position,
      }));

  const [homeAvailable, awayAvailable] = await Promise.all([
    getMatchAthletesForSide(matchId, "home"),
    getMatchAthletesForSide(matchId, "away"),
  ]);

  return {
    matchId: match.id,
    home: {
      teamId: match.homeTeamId,
      clubName: match.homeTeam.club.name,
      entries: mapEntries(match.homeTeamId),
      availableAthletes: homeAvailable.map((a) => ({
        id: a.id,
        label: a.label,
        shirtNumber: a.shirtNumber,
      })),
    },
    away: {
      teamId: match.awayTeamId,
      clubName: match.awayTeam.club.name,
      entries: mapEntries(match.awayTeamId),
      availableAthletes: awayAvailable.map((a) => ({
        id: a.id,
        label: a.label,
        shirtNumber: a.shirtNumber,
      })),
    },
  };
}

export async function saveTeamLineup(
  matchId: string,
  teamId: string,
  entries: { athleteId: string; role: LineupRole; shirtNumber?: number | null }[]
) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { homeTeamId: true, awayTeamId: true },
  });
  if (!match) throw new Error("MATCH_NOT_FOUND");
  if (teamId !== match.homeTeamId && teamId !== match.awayTeamId) {
    throw new Error("INVALID_TEAM");
  }

  await prisma.$transaction(async (tx) => {
    await tx.lineup.deleteMany({ where: { matchId, teamId } });
    if (entries.length > 0) {
      await tx.lineup.createMany({
        data: entries.map((e) => ({
          matchId,
          teamId,
          athleteId: e.athleteId,
          role: e.role,
          shirtNumber: e.shirtNumber ?? undefined,
        })),
      });
    }
  });
}
