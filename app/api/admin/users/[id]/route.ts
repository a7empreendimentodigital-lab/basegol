import bcrypt from "bcryptjs";
import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { canAssignRole } from "@/lib/role-access";
import { syncUserClubLink, syncUserChampionshipMembership, syncUserOperatorMatches } from "@/lib/user-admin";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/utils/api-response";
import { userUpdateSchema } from "@/utils/zod-schemas/user.schemas";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionUser = await getSessionUserOrThrow();
    if (!hasRole(sessionUser.role.slug.toUpperCase(), ["SUPER_ADMIN", "ADMIN_LIGA"])) {
      return fail("Sem permissão", 403);
    }

    const { id } = await params;
    const parsed = userUpdateSchema.parse(await req.json());
    const data: Record<string, unknown> = {};
    if (parsed.name) data.name = parsed.name;
    if (parsed.email) data.email = parsed.email.toLowerCase();
    if (parsed.status) data.status = parsed.status;
    if (parsed.password) data.passwordHash = await bcrypt.hash(parsed.password, 12);
    const existing = await prisma.user.findUnique({
      where: { id },
      include: { role: true, clubUsers: { take: 1 } },
    });
    if (!existing) return fail("Usuário não encontrado", 404);

    if (parsed.roleSlug) {
      if (!canAssignRole(sessionUser.role.slug.toUpperCase(), parsed.roleSlug)) {
        return fail("Sem permissão para atribuir este papel", 403);
      }
      const role = await prisma.role.findUnique({ where: { slug: parsed.roleSlug } });
      if (!role) return fail("Papel inválido", 400);
      data.roleId = role.id;
    }

    const updated = await prisma.user.update({ where: { id }, data: data as never });
    const effectiveRole = (parsed.roleSlug ?? existing.role.slug).toUpperCase();

    if (parsed.clubId !== undefined || parsed.roleSlug) {
      const clubId =
        parsed.clubId !== undefined ? parsed.clubId : (existing.clubUsers[0]?.clubId ?? null);
      await syncUserClubLink(id, effectiveRole, clubId);
    }

    if (parsed.assignedMatchIds !== undefined || parsed.roleSlug) {
      await syncUserOperatorMatches(id, effectiveRole, parsed.assignedMatchIds, sessionUser.id);
    }

    if (parsed.championshipId !== undefined || parsed.roleSlug) {
      await syncUserChampionshipMembership(
        id,
        effectiveRole,
        parsed.championshipId ?? null
      );
    }

    return ok(updated);
  } catch {
    return fail("Erro ao atualizar usuário", 400);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionUser = await getSessionUserOrThrow();
    if (!hasRole(sessionUser.role.slug.toUpperCase(), ["SUPER_ADMIN"])) {
      return fail("Somente super admin pode excluir usuários", 403);
    }
    const { id } = await params;
    await prisma.user.delete({ where: { id } });
    return ok({ deleted: true });
  } catch {
    return fail("Erro ao excluir usuário", 400);
  }
}
