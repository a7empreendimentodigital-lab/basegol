import bcrypt from "bcryptjs";
import { canCreateRole, requireChampionshipScopedAdmin } from "@/lib/admin-auth";
import { assertMatchInChampionship } from "@/lib/championship-access";
import { syncUserClubLink, syncUserChampionshipMembership, syncUserOperatorMatches } from "@/lib/user-admin";
import { prisma } from "@/lib/prisma";
import { championshipMemberCreateSchema } from "@/utils/zod-schemas/championship-sponsor.schemas";
import { fail, ok } from "@/utils/api-response";
import { formatPrismaError } from "@/lib/prisma-user-error";

type RouteCtx = { params: Promise<{ championshipId: string }> };

export async function GET(_req: Request, { params }: RouteCtx) {
  try {
    const { championshipId } = await params;
    const ctx = await requireChampionshipScopedAdmin(championshipId);

    const memberUserIds = await prisma.championshipMember.findMany({
      where: { championshipId },
      select: { userId: true },
    });
    const ids = memberUserIds.map((m) => m.userId);

    const operators = await prisma.user.findMany({
      where: {
        role: { slug: "OPERADOR_DE_PARTIDA" },
        matchOperators: {
          some: {
            match: {
              OR: [
                { championshipId },
                { group: { category: { championshipId } } },
              ],
            },
          },
        },
      },
      include: {
        role: true,
        matchOperators: {
          where: {
            match: {
              OR: [
                { championshipId },
                { group: { category: { championshipId } } },
              ],
            },
          },
          select: { matchId: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const admins = await prisma.user.findMany({
      where: { id: { in: ids } },
      include: { role: true },
      orderBy: { name: "asc" },
    });

    const items = [
      ...admins.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        status: u.status,
        role: u.role.slug,
        assignedMatchIds: [] as string[],
      })),
      ...operators
        .filter((o) => !ids.includes(o.id))
        .map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          status: u.status,
          role: u.role.slug,
          assignedMatchIds: u.matchOperators.map((m) => m.matchId),
        })),
    ];

    return ok({ items, actorRole: ctx.role });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "FORBIDDEN") return fail("Sem permissão", 403);
    return fail("Não autenticado", 401);
  }
}

export async function POST(req: Request, { params }: RouteCtx) {
  try {
    const { championshipId } = await params;
    const ctx = await requireChampionshipScopedAdmin(championshipId);
    const body = championshipMemberCreateSchema.parse(await req.json());

    if (!canCreateRole(ctx.role, body.roleSlug)) {
      return fail("Sem permissão para criar este tipo de usuário", 403);
    }

    if (body.roleSlug === "OPERADOR_DE_PARTIDA" && body.assignedMatchIds?.length) {
      await assertMatchInChampionship(body.assignedMatchIds, championshipId);
    }

    const role = await prisma.role.findUnique({ where: { slug: body.roleSlug } });
    if (!role) return fail("Papel inválido", 400);

    const passwordHash = await bcrypt.hash(body.password, 12);
    const created = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        passwordHash,
        status: body.status,
        roleId: role.id,
        mustChangePassword: true,
      },
    });

    await syncUserClubLink(created.id, body.roleSlug, null);
    await syncUserChampionshipMembership(
      created.id,
      body.roleSlug,
      body.roleSlug === "ADMIN_CAMPEONATO" ? championshipId : null
    );
    await syncUserOperatorMatches(
      created.id,
      body.roleSlug,
      body.assignedMatchIds ?? [],
      ctx.user.id
    );

    return ok({ id: created.id }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "FORBIDDEN") return fail("Sem permissão", 403);
    if (msg === "MATCH_NOT_IN_CHAMPIONSHIP") {
      return fail("Um ou mais jogos não pertencem a este campeonato", 400);
    }
    return fail(formatPrismaError(e), 400);
  }
}
