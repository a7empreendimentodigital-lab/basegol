import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/utils/api-response";

async function ensureAdmin() {
  const user = await getSessionUserOrThrow();
  const role = user.role.slug.toUpperCase();
  if (!hasRole(role, ["SUPER_ADMIN", "ADMIN_LIGA", "CLUBE"])) {
    throw new Error("FORBIDDEN");
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ type: string }> }) {
  try {
    await ensureAdmin();
    const { type } = await params;

    if (type === "championships") {
      const items = await prisma.championship.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, season: true },
      });
      return ok(items.map((i) => ({ value: i.id, label: `${i.name} (${i.season})` })));
    }

    if (type === "categories") {
      const championshipId = new URL(_req.url).searchParams.get("championshipId");
      const items = await prisma.category.findMany({
        where: championshipId ? { championshipId } : undefined,
        orderBy: { name: "asc" },
        include: { championship: true },
      });
      return ok(items.map((i) => ({ value: i.id, label: `${i.name} — ${i.championship.name}` })));
    }

    if (type === "groups") {
      const categoryId = new URL(_req.url).searchParams.get("categoryId");
      const items = await prisma.group.findMany({
        where: categoryId ? { categoryId } : undefined,
        orderBy: { name: "asc" },
        include: { category: true },
      });
      return ok(items.map((i) => ({ value: i.id, label: `${i.name} — ${i.category.name}` })));
    }

    if (type === "clubs") {
      const items = await prisma.club.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, crestUrl: true },
      });
      return ok(items.map((i) => ({ value: i.id, label: i.name, crestUrl: i.crestUrl })));
    }

    if (type === "teams") {
      const groupId = new URL(_req.url).searchParams.get("groupId");
      if (!groupId) {
        return ok([]);
      }

      const items = await prisma.team.findMany({
        where: { groupId },
        orderBy: { club: { name: "asc" } },
        include: { club: true },
      });

      return ok(
        items.map((i) => ({
          value: i.id,
          label: i.club.name,
          crestUrl: i.club.crestUrl,
        }))
      );
    }

    if (type === "roles") {
      const items = await prisma.role.findMany({ orderBy: { name: "asc" } });
      return ok(items.map((i) => ({ value: i.id, label: i.name, slug: i.slug })));
    }

    if (type === "matches") {
      const items = await prisma.match.findMany({
        orderBy: { scheduledAt: "desc" },
        take: 80,
        include: {
          homeTeam: { include: { club: true } },
          awayTeam: { include: { club: true } },
        },
      });
      return ok(
        items.map((m) => ({
          value: m.id,
          label: `${m.homeTeam.club.name} x ${m.awayTeam.club.name} — ${m.status}`,
        }))
      );
    }

    if (type === "athletes") {
      const clubId = new URL(_req.url).searchParams.get("clubId");
      const items = await prisma.athlete.findMany({
        where: clubId ? { clubId } : undefined,
        orderBy: { lastName: "asc" },
      });
      return ok(items.map((i) => ({ value: i.id, label: `${i.firstName} ${i.lastName}` })));
    }

    return fail("Tipo de opção inválido", 404);
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return fail("Sem permissão", 403);
    return fail("Não autenticado", 401);
  }
}
