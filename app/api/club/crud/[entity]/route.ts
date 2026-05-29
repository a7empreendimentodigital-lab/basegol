import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { resolveClubId } from "@/lib/club-scope";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { prepareAdminPayload } from "@/lib/admin-transform";
import { fail, ok } from "@/utils/api-response";
import { adminListQuerySchema } from "@/utils/zod-schemas";
import { CLUB_ENTITY_SCHEMAS } from "@/utils/zod-schemas/club-portal.schemas";
import { prismaContains } from "@/lib/prisma-search";
import { normalizePagination } from "@/utils/pagination";

const allowed = ["athletes", "staff", "documents", "registrations"] as const;

export async function GET(req: Request, { params }: { params: Promise<{ entity: string }> }) {
  try {
    const user = await getSessionUserOrThrow();
    const role = user.role.slug.toUpperCase();
    if (!hasRole(role, ["CLUBE", "SUPER_ADMIN", "ADMIN_LIGA"])) {
      return fail("Sem permissão", 403);
    }
    const { entity } = await params;
    if (!allowed.includes(entity as (typeof allowed)[number])) {
      return fail("Entidade inválida", 404);
    }

    const clubId = resolveClubId(user);
    const url = new URL(req.url);
    const parsed = adminListQuerySchema.parse({
      q: url.searchParams.get("q") ?? undefined,
      page: url.searchParams.get("page") ?? 1,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });
    const { skip, pageSize } = normalizePagination(parsed);
    const contains = parsed.q ? prismaContains(parsed.q) : undefined;

    if (entity === "athletes") {
      const where = {
        clubId,
        ...(contains
          ? { OR: [{ firstName: contains }, { lastName: contains }] }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.athlete.findMany({ where, orderBy: { lastName: "asc" }, skip, take: pageSize }),
        prisma.athlete.count({ where }),
      ]);
      return ok({ items, total });
    }

    if (entity === "staff") {
      const where = { clubId, ...(contains ? { name: contains } : {}) };
      const [items, total] = await Promise.all([
        prisma.staffMember.findMany({ where, orderBy: { name: "asc" }, skip, take: pageSize }),
        prisma.staffMember.count({ where }),
      ]);
      return ok({ items, total });
    }

    if (entity === "documents") {
      const where = { clubId };
      const [items, total] = await Promise.all([
        prisma.document.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
          include: { athlete: true },
        }),
        prisma.document.count({ where }),
      ]);
      return ok({ items, total });
    }

    const [items, total] = await Promise.all([
      prisma.registration.findMany({
        where: { clubId },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: { championship: true },
      }),
      prisma.registration.count({ where: { clubId } }),
    ]);
    return ok({ items, total });
  } catch (e) {
    if (e instanceof Error && e.message === "NO_CLUB") return fail("Clube não vinculado", 400);
    return fail("Não autenticado", 401);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ entity: string }> }) {
  try {
    const user = await getSessionUserOrThrow();
    const role = user.role.slug.toUpperCase();
    if (!hasRole(role, ["CLUBE", "SUPER_ADMIN", "ADMIN_LIGA"])) {
      return fail("Sem permissão", 403);
    }
    const { entity } = await params;
    const schema = CLUB_ENTITY_SCHEMAS[entity];
    if (!schema) return fail("Entidade inválida", 404);

    const clubId = resolveClubId(user);
    const raw = await req.json();
    const parsed = schema.parse(raw);
    const payload = prepareAdminPayload(entity, parsed as Record<string, unknown>);

    if (entity === "athletes") {
      const slug = `${slugify(`${payload.firstName}-${payload.lastName}`)}-${Date.now()}`;
      return ok(
        await prisma.athlete.create({
          data: { ...payload, clubId, slug } as never,
        }),
        201
      );
    }
    if (entity === "staff") {
      return ok(await prisma.staffMember.create({ data: { ...payload, clubId } as never }), 201);
    }
    if (entity === "documents") {
      return ok(await prisma.document.create({ data: { ...payload, clubId } as never }), 201);
    }
    return ok(
      await prisma.registration.create({
        data: { ...payload, clubId } as never,
      }),
      201
    );
  } catch (e) {
    if (e instanceof Error && e.message === "NO_CLUB") return fail("Clube não vinculado", 400);
    return fail("Erro ao criar", 400, e instanceof Error ? e.message : undefined);
  }
}
