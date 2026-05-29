import { prisma } from "@/lib/prisma";

export async function listMatchesForOperator(userId: string, isPrivileged = false) {
  return prisma.match.findMany({
    where: isPrivileged ? undefined : { operators: { some: { userId } } },
    include: {
      homeTeam: { include: { club: true } },
      awayTeam: { include: { club: true } },
      operators: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
    orderBy: { scheduledAt: "desc" },
    take: 50,
  });
}

export async function canOperateMatch(userId: string, matchId: string, isPrivileged = false) {
  if (isPrivileged) return true;
  const assignment = await prisma.matchOperator.findUnique({
    where: { matchId_userId: { matchId, userId } },
  });
  return Boolean(assignment?.canEditLive);
}

export type OperatorAthleteOption = {
  id: string;
  label: string;
  shirtNumber: number | null;
};

function formatAthleteLabel(
  firstName: string,
  lastName: string,
  shirtNumber: number | null | undefined
) {
  const name = `${firstName} ${lastName}`.trim();
  return shirtNumber != null ? `${name} (#${shirtNumber})` : name;
}

/** Atletas da escalação da partida; se vazia, todos os atletas ativos do clube do time. */
export async function getMatchAthletesForSide(
  matchId: string,
  side: "home" | "away"
): Promise<OperatorAthleteOption[]> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: true,
      awayTeam: true,
      lineups: {
        include: { athlete: true },
      },
    },
  });
  if (!match) return [];

  const teamId = side === "home" ? match.homeTeamId : match.awayTeamId;
  const clubId = side === "home" ? match.homeTeam.clubId : match.awayTeam.clubId;

  const teamLineups = match.lineups.filter((l) => l.teamId === teamId);
  if (teamLineups.length > 0) {
    return teamLineups
      .map((l) => ({
        id: l.athlete.id,
        label: formatAthleteLabel(
          l.athlete.firstName,
          l.athlete.lastName,
          l.shirtNumber ?? l.athlete.shirtNumber
        ),
        shirtNumber: l.shirtNumber ?? l.athlete.shirtNumber,
      }))
      .sort((a, b) => (a.shirtNumber ?? 99) - (b.shirtNumber ?? 99));
  }

  const clubAthletes = await prisma.athlete.findMany({
    where: { clubId, status: "ACTIVE" },
    orderBy: [{ shirtNumber: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
  });

  return clubAthletes.map((a) => ({
    id: a.id,
    label: formatAthleteLabel(a.firstName, a.lastName, a.shirtNumber),
    shirtNumber: a.shirtNumber,
  }));
}
