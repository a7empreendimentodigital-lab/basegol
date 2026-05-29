import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/utils/api-response";

export async function GET() {
  try {
    const user = await getSessionUserOrThrow();
    if (!hasRole(user.role.slug.toUpperCase(), ["SUPER_ADMIN", "ADMIN_LIGA"])) {
      return fail("Sem permissão", 403);
    }

    const [clubs, athletes, matchesToday, championships, liveMatches] = await Promise.all([
      prisma.club.count({ where: { status: "APPROVED" } }),
      prisma.athlete.count(),
      prisma.match.count({
        where: {
          scheduledAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.championship.count({ where: { status: "ACTIVE" } }),
      prisma.match.count({ where: { status: { in: ["LIVE", "HALFTIME"] } } }),
    ]);

    return ok({ clubs, athletes, matchesToday, championships, liveMatches });
  } catch {
    return fail("Não autenticado", 401);
  }
}
