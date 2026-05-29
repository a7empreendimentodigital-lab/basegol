import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { resolveClubId } from "@/lib/club-scope";
import { prisma } from "@/lib/prisma";
import { prepareAdminPayload } from "@/lib/admin-transform";
import { fail, ok } from "@/utils/api-response";
import { CLUB_ENTITY_SCHEMAS } from "@/utils/zod-schemas/club-portal.schemas";

const allowed = ["athletes", "staff", "documents", "registrations"] as const;

async function assertOwnership(entity: string, id: string, clubId: string) {
  if (entity === "athletes") {
    const row = await prisma.athlete.findUnique({ where: { id } });
    return row?.clubId === clubId ? row : null;
  }
  if (entity === "staff") {
    const row = await prisma.staffMember.findUnique({ where: { id } });
    return row?.clubId === clubId ? row : null;
  }
  if (entity === "documents") {
    const row = await prisma.document.findUnique({ where: { id } });
    return row?.clubId === clubId ? row : null;
  }
  const row = await prisma.registration.findUnique({ where: { id } });
  return row?.clubId === clubId ? row : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ entity: string; id: string }> }) {
  try {
    const user = await getSessionUserOrThrow();
    const role = user.role.slug.toUpperCase();
    if (!hasRole(role, ["CLUBE", "SUPER_ADMIN", "ADMIN_LIGA"])) {
      return fail("Sem permissão", 403);
    }
    const { entity, id } = await params;
    const schema = CLUB_ENTITY_SCHEMAS[entity];
    if (!schema || !allowed.includes(entity as (typeof allowed)[number])) {
      return fail("Entidade inválida", 404);
    }

    const clubId = resolveClubId(user);
    if (!(await assertOwnership(entity, id, clubId))) {
      return fail("Registro não encontrado", 404);
    }

    const parsed = schema.partial().parse(await req.json());
    const payload = prepareAdminPayload(entity, parsed as Record<string, unknown>);

    if (entity === "athletes") return ok(await prisma.athlete.update({ where: { id }, data: payload as never }));
    if (entity === "staff") return ok(await prisma.staffMember.update({ where: { id }, data: payload as never }));
    if (entity === "documents") return ok(await prisma.document.update({ where: { id }, data: payload as never }));
    return ok(await prisma.registration.update({ where: { id }, data: payload as never }));
  } catch {
    return fail("Erro ao atualizar", 400);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ entity: string; id: string }> }) {
  try {
    const user = await getSessionUserOrThrow();
    const role = user.role.slug.toUpperCase();
    if (!hasRole(role, ["CLUBE", "SUPER_ADMIN", "ADMIN_LIGA"])) {
      return fail("Sem permissão", 403);
    }
    const { entity, id } = await params;
    if (!allowed.includes(entity as (typeof allowed)[number])) {
      return fail("Entidade inválida", 404);
    }

    const clubId = resolveClubId(user);
    if (!(await assertOwnership(entity, id, clubId))) {
      return fail("Registro não encontrado", 404);
    }

    if (entity === "athletes") await prisma.athlete.delete({ where: { id } });
    else if (entity === "staff") await prisma.staffMember.delete({ where: { id } });
    else if (entity === "documents") await prisma.document.delete({ where: { id } });
    else await prisma.registration.delete({ where: { id } });

    return ok({ deleted: true });
  } catch {
    return fail("Erro ao excluir", 400);
  }
}
