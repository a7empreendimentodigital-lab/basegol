import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/utils/api-response";

export async function GET() {
  try {
    const user = await getSessionUserOrThrow();
    if (!hasRole(user.role.slug.toUpperCase(), ["CLUBE", "SUPER_ADMIN", "ADMIN_LIGA"])) {
      return fail("Sem permissão", 403);
    }

    const items = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return ok({ items, total: items.length });
  } catch {
    return fail("Não autenticado", 401);
  }
}
