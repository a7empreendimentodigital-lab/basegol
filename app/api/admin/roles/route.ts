import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/utils/api-response";

export async function GET() {
  try {
    const user = await getSessionUserOrThrow();
    if (!hasRole(user.role.slug.toUpperCase(), ["SUPER_ADMIN", "ADMIN_LIGA"])) {
      return fail("Sem permissão", 403);
    }

    const roles = await prisma.role.findMany({
      orderBy: { name: "asc" },
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });

    return ok(
      roles.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        userCount: r._count.users,
        permissions: r.rolePermissions.map((rp) => rp.permission.code),
      }))
    );
  } catch {
    return fail("Não autenticado", 401);
  }
}
