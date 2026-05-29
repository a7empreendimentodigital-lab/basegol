import { getSessionUserOrThrow } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/utils/api-response";

export async function GET() {
  try {
    const user = await getSessionUserOrThrow();
    const items = await prisma.favorite.findMany({
      where: { userId: user.id, type: "CLUB" },
      orderBy: { createdAt: "desc" },
    });
    const clubIds = items.map((f) => f.entityId);
    if (clubIds.length === 0) return ok([]);

    const clubs = await prisma.club.findMany({
      where: { id: { in: clubIds } },
      select: { id: true, slug: true, name: true, crestUrl: true, city: true },
    });
    const map = new Map(clubs.map((c) => [c.id, c]));
    const ordered = items.map((f) => map.get(f.entityId)).filter(Boolean);
    return ok(ordered);
  } catch {
    return fail("Não autenticado", 401);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUserOrThrow();
    const { clubId } = (await req.json()) as { clubId?: string };
    if (!clubId) return fail("Clube inválido", 400);

    await prisma.favorite.upsert({
      where: { userId_type_entityId: { userId: user.id, type: "CLUB", entityId: clubId } },
      update: {},
      create: { userId: user.id, type: "CLUB", entityId: clubId },
    });

    return ok({ saved: true });
  } catch {
    return fail("Não autenticado", 401);
  }
}

