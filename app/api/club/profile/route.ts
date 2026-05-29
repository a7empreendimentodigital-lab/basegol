import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { resolveClubId } from "@/lib/club-scope";
import { prisma } from "@/lib/prisma";
import { prepareAdminPayload } from "@/lib/admin-transform";
import { fail, ok } from "@/utils/api-response";
import { clubProfileSchema } from "@/utils/zod-schemas/club-portal.schemas";

export async function GET() {
  try {
    const user = await getSessionUserOrThrow();
    if (!hasRole(user.role.slug.toUpperCase(), ["CLUBE", "SUPER_ADMIN", "ADMIN_LIGA"])) {
      return fail("Sem permissão", 403);
    }
    const clubId = resolveClubId(user);
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) return fail("Clube não encontrado", 404);
    return ok(club);
  } catch (e) {
    if (e instanceof Error && e.message === "NO_CLUB") return fail("Clube não vinculado", 400);
    return fail("Não autenticado", 401);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getSessionUserOrThrow();
    if (!hasRole(user.role.slug.toUpperCase(), ["CLUBE", "SUPER_ADMIN", "ADMIN_LIGA"])) {
      return fail("Sem permissão", 403);
    }
    const clubId = resolveClubId(user);
    const parsed = clubProfileSchema.parse(await req.json());
    const payload = prepareAdminPayload("clubs", parsed as Record<string, unknown>);
    const club = await prisma.club.update({ where: { id: clubId }, data: payload as never });
    return ok(club);
  } catch (e) {
    if (e instanceof Error && e.message === "NO_CLUB") return fail("Clube não vinculado", 400);
    return fail("Erro ao atualizar perfil", 400);
  }
}
