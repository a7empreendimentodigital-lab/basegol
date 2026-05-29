import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/utils/api-response";

export async function GET() {
  try {
    const user = await getSessionUserOrThrow();
    if (!hasRole(user.role.slug.toUpperCase(), ["SUPER_ADMIN", "ADMIN_LIGA"])) {
      return fail("Sem permissão", 403);
    }

    const [clubsByStatus, topScorers, recentMatches, pendingDocs] = await Promise.all([
      prisma.club.groupBy({ by: ["status"], _count: { id: true } }),
      prisma.athlete.findMany({
        take: 10,
        orderBy: { shirtNumber: "asc" },
        include: { club: true },
      }),
      prisma.match.findMany({
        take: 15,
        orderBy: { scheduledAt: "desc" },
        include: {
          homeTeam: { include: { club: true } },
          awayTeam: { include: { club: true } },
        },
      }),
      prisma.document.count({ where: { status: "PENDING" } }),
    ]);

    const goals = await prisma.matchEvent.count({ where: { type: "GOAL" } });

    return ok({
      clubsByStatus,
      goals,
      pendingDocs,
      topAthletes: topScorers.map((a) => ({
        name: `${a.firstName} ${a.lastName}`,
        club: a.club.name,
        shirtNumber: a.shirtNumber,
      })),
      recentMatches: recentMatches.map((m) => ({
        id: m.id,
        label: `${m.homeTeam.club.name} ${m.homeScore} x ${m.awayScore} ${m.awayTeam.club.name}`,
        status: m.status,
        scheduledAt: m.scheduledAt,
      })),
    });
  } catch {
    return fail("Não autenticado", 401);
  }
}
