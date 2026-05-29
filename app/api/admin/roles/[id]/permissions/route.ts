import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/utils/api-response";
import { z } from "zod";

const schema = z.object({
  permissionCodes: z.array(z.string()),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUserOrThrow();
    if (!hasRole(user.role.slug.toUpperCase(), ["SUPER_ADMIN"])) {
      return fail("Somente super admin pode alterar permissões", 403);
    }

    const { id: roleId } = await params;
    const { permissionCodes } = schema.parse(await req.json());

    const permissions = await prisma.permission.findMany({
      where: { code: { in: permissionCodes } },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId } });
    if (permissions.length) {
      await prisma.rolePermission.createMany({
        data: permissions.map((p) => ({ roleId, permissionId: p.id })),
      });
    }

    await prisma.role.update({
      where: { id: roleId },
      data: { permissions: permissionCodes },
    });

    return ok({ updated: true });
  } catch {
    return fail("Erro ao salvar permissões", 400);
  }
}
