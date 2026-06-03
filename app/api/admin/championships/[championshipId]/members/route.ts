import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { canCreateRole, requireChampionshipScopedAdmin } from "@/lib/admin-auth";
import { assertMatchInChampionship } from "@/lib/championship-access";
import { ensureSystemRole } from "@/lib/system-roles";
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

    const role = await ensureSystemRole(body.roleSlug);
    if (!role) return fail("Papel inválido", 400);

    const email = body.email.toLowerCase().trim();
    const existingEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingEmail) {
      return fail("Já existe um usuário com este e-mail.", 409);
    }

    const championship = await prisma.championship.findUnique({
      where: { id: championshipId },
      select: { id: true },
    });
    if (!championship) return fail("Campeonato não encontrado", 404);

    const passwordHash = await bcrypt.hash(body.password, 12);
    const matchIds = body.assignedMatchIds ?? [];

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: body.name.trim(),
          email,
          passwordHash,
          status: body.status,
          roleId: role.id,
          mustChangePassword: true,
        },
      });

      await tx.clubUser.deleteMany({ where: { userId: user.id } });

      if (body.roleSlug === "ADMIN_CAMPEONATO") {
        await tx.championshipMember.deleteMany({ where: { userId: user.id } });
        await tx.championshipMember.create({
          data: { userId: user.id, championshipId },
        });
      } else {
        await tx.championshipMember.deleteMany({ where: { userId: user.id } });
        await tx.matchOperator.deleteMany({ where: { userId: user.id } });
        if (matchIds.length > 0) {
          await tx.matchOperator.createMany({
            data: matchIds.map((matchId) => ({
              matchId,
              userId: user.id,
              canEditLive: true,
              canEditStats: true,
              assignedBy: ctx.user.id,
            })),
            skipDuplicates: true,
          });
        }
      }

      return user;
    });

    return ok({ id: created.id }, 201);
  } catch (e) {
    if (e instanceof ZodError) {
      const first = e.errors[0];
      return fail(first?.message ?? "Dados inválidos", 400);
    }
    const msg = e instanceof Error ? e.message : "";
    if (msg === "FORBIDDEN") return fail("Sem permissão", 403);
    if (msg === "MATCH_NOT_IN_CHAMPIONSHIP") {
      return fail("Um ou mais jogos não pertencem a este campeonato", 400);
    }
    return fail(formatPrismaError(e), 400);
  }
}
