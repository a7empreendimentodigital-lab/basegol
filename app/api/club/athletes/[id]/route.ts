import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";
import { clubAthleteUpdateSchema } from "@/utils/zod-schemas";
import { fail, ok } from "@/utils/api-response";

async function canMutateAthlete(userId: string, role: string, athleteId: string) {
  if (hasRole(role, ["SUPER_ADMIN", "ADMIN_LIGA"])) return true;
  if (role !== "CLUBE") return false;
  const membership = await prisma.clubUser.findFirst({ where: { userId } });
  if (!membership) return false;
  const athlete = await prisma.athlete.findUnique({ where: { id: athleteId } });
  return athlete?.clubId === membership.clubId;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUserOrThrow();
    const role = user.role.slug.toUpperCase();
    if (!hasRole(role, ["CLUBE", "SUPER_ADMIN", "ADMIN_LIGA"])) {
      return fail("Sem permissão", 403);
    }
    if (!(await canMutateAthlete(user.id, role, id))) {
      return fail("Sem acesso ao atleta", 403);
    }
    const parsed = clubAthleteUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail("Payload inválido", 400, parsed.error.flatten());
    }
    const athlete = await prisma.athlete.update({ where: { id }, data: parsed.data });
    return ok(athlete);
  } catch {
    return fail("Erro ao atualizar atleta", 400);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUserOrThrow();
    const role = user.role.slug.toUpperCase();
    if (!hasRole(role, ["CLUBE", "SUPER_ADMIN", "ADMIN_LIGA"])) {
      return fail("Sem permissão", 403);
    }
    if (!(await canMutateAthlete(user.id, role, id))) {
      return fail("Sem acesso ao atleta", 403);
    }
    await prisma.athlete.delete({ where: { id } });
    return ok({ deleted: true });
  } catch {
    return fail("Erro ao remover atleta", 400);
  }
}
