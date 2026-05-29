import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { resolveClubId } from "@/lib/club-scope";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/utils/api-response";

export async function GET() {
  try {
    const user = await getSessionUserOrThrow();
    if (!hasRole(user.role.slug.toUpperCase(), ["CLUBE", "SUPER_ADMIN", "ADMIN_LIGA"])) {
      return fail("Sem permissão", 403);
    }
    const clubId = resolveClubId(user);

    const [athletes, staff, documentsPending, registrations] = await Promise.all([
      prisma.athlete.count({ where: { clubId } }),
      prisma.staffMember.count({ where: { clubId, status: "ACTIVE" } }),
      prisma.document.count({ where: { clubId, status: "PENDING" } }),
      prisma.registration.count({ where: { clubId } }),
    ]);

    const teamIds = (
      await prisma.team.findMany({ where: { clubId }, select: { id: true } })
    ).map((t) => t.id);

    const upcomingMatches = teamIds.length
      ? await prisma.match.count({
          where: {
            OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
            scheduledAt: { gte: new Date() },
            status: "SCHEDULED",
          },
        })
      : 0;

    const club = await prisma.club.findUnique({ where: { id: clubId } });

    return ok({
      clubName: club?.name,
      athletes,
      staff,
      documentsPending,
      registrations,
      upcomingMatches,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "NO_CLUB") return fail("Clube não vinculado", 400);
    return fail("Não autenticado", 401);
  }
}
