import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { clubAthleteCreateSchema } from "@/utils/zod-schemas";
import { listClubAthletes } from "@/services/club.service";
import { fail, ok } from "@/utils/api-response";

export async function GET() {
  try {
    const user = await getSessionUserOrThrow();
    const role = user.role.slug.toUpperCase();
    if (!hasRole(role, ["CLUBE", "SUPER_ADMIN", "ADMIN_LIGA"])) {
      return fail("Sem permissão", 403);
    }

    const ownClubId = user.clubUsers[0]?.clubId;
    if (!ownClubId && role === "CLUBE") {
      return fail("Usuário de clube sem vínculo", 400);
    }
    const clubId = role === "CLUBE" ? ownClubId : ownClubId;
    if (!clubId) {
      return fail("clubId é obrigatório", 400);
    }
    const athletes = await listClubAthletes(clubId);
    return ok(athletes);
  } catch {
    return fail("Não autenticado", 401);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUserOrThrow();
    const role = user.role.slug.toUpperCase();
    if (!hasRole(role, ["CLUBE", "SUPER_ADMIN", "ADMIN_LIGA"])) {
      return fail("Sem permissão", 403);
    }

    const parsed = clubAthleteCreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail("Payload inválido", 400, parsed.error.flatten());
    }

    const ownClubId = user.clubUsers[0]?.clubId;
    if (!ownClubId && role === "CLUBE") return fail("Usuário de clube sem vínculo", 400);
    const clubId = role === "CLUBE" ? ownClubId : parsed.data.clubId;
    if (!clubId) return fail("clubId é obrigatório", 400);

    const slugBase = slugify(`${parsed.data.firstName}-${parsed.data.lastName}`);
    const slug = `${slugBase}-${Date.now()}`;
    const athlete = await prisma.athlete.create({
      data: {
        clubId,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        slug,
        birthDate: new Date(parsed.data.birthDate),
        position: parsed.data.position,
        shirtNumber: parsed.data.shirtNumber,
        category: parsed.data.category,
      },
    });
    return ok(athlete, 201);
  } catch {
    return fail("Não autenticado", 401);
  }
}
