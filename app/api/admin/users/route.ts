import bcrypt from "bcryptjs";
import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { canAssignRole } from "@/lib/role-access";
import { ensureSystemRole } from "@/lib/system-roles";
import { syncUserClubLink, syncUserChampionshipMembership, syncUserOperatorMatches } from "@/lib/user-admin";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/utils/api-response";
import { adminListQuerySchema } from "@/utils/zod-schemas";
import { userCreateSchema } from "@/utils/zod-schemas/user.schemas";
import { prismaContains } from "@/lib/prisma-search";
import { normalizePagination } from "@/utils/pagination";

export async function GET(req: Request) {
  try {
    const user = await getSessionUserOrThrow();
    if (!hasRole(user.role.slug.toUpperCase(), ["SUPER_ADMIN", "ADMIN_LIGA"])) {
      return fail("Sem permissão", 403);
    }

    const url = new URL(req.url);
    const parsed = adminListQuerySchema.parse({
      q: url.searchParams.get("q") ?? undefined,
      page: url.searchParams.get("page") ?? 1,
      pageSize: url.searchParams.get("pageSize") ?? 20,
    });
    const { skip, pageSize } = normalizePagination(parsed);
    const contains = parsed.q ? prismaContains(parsed.q) : undefined;

    const where = contains ? { OR: [{ email: contains }, { name: contains }] } : undefined;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          role: true,
          clubUsers: { include: { club: true } },
          matchOperators: { select: { matchId: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return ok({
      items: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        status: u.status,
        role: u.role.slug.toUpperCase(),
        roleId: u.roleId,
        mustChangePassword: u.mustChangePassword,
        clubs: u.clubUsers.map((c) => c.club.name),
        clubId: u.clubUsers[0]?.clubId ?? null,
        assignedMatchIds: u.matchOperators.map((o) => o.matchId),
      })),
      total,
    });
  } catch {
    return fail("Não autenticado", 401);
  }
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUserOrThrow();
    if (!hasRole(sessionUser.role.slug.toUpperCase(), ["SUPER_ADMIN", "ADMIN_LIGA"])) {
      return fail("Sem permissão", 403);
    }

    const parsed = userCreateSchema.parse(await req.json());
    const actorRole = sessionUser.role.slug.toUpperCase();

    if (!canAssignRole(actorRole, parsed.roleSlug)) {
      return fail("Sem permissão para atribuir este papel", 403);
    }

    const role = await ensureSystemRole(parsed.roleSlug);
    if (!role) return fail("Papel inválido", 400);

    const passwordHash = await bcrypt.hash(parsed.password, 12);
    const created = await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email.toLowerCase(),
        passwordHash,
        status: parsed.status,
        roleId: role.id,
        mustChangePassword: true,
      },
    });

    await syncUserClubLink(created.id, parsed.roleSlug, parsed.clubId);
    await syncUserChampionshipMembership(
      created.id,
      parsed.roleSlug,
      parsed.championshipId
    );
    await syncUserOperatorMatches(
      created.id,
      parsed.roleSlug,
      parsed.assignedMatchIds ?? [],
      sessionUser.id
    );

    return ok(created, 201);
  } catch (e) {
    return fail("Erro ao criar usuário", 400, e instanceof Error ? e.message : undefined);
  }
}
