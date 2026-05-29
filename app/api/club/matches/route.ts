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
    const teamIds = (
      await prisma.team.findMany({ where: { clubId }, select: { id: true } })
    ).map((t) => t.id);

    if (!teamIds.length) return ok([]);

    const matches = await prisma.match.findMany({
      where: { OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }] },
      orderBy: { scheduledAt: "asc" },
      take: 50,
      include: {
        homeTeam: { include: { club: true } },
        awayTeam: { include: { club: true } },
      },
    });

    return ok(matches);
  } catch (e) {
    if (e instanceof Error && e.message === "NO_CLUB") return fail("Clube não vinculado", 400);
    return fail("Não autenticado", 401);
  }
}
