import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";
import { adminListQuerySchema } from "@/utils/zod-schemas";
import { ENTITY_SCHEMAS } from "@/utils/zod-schemas/admin-entities";
import { prepareAdminPayload } from "@/lib/admin-transform";
import { ensureUniqueClubSlug } from "@/lib/club-slug";
import { formatPrismaError } from "@/lib/prisma-user-error";
import { slugify } from "@/lib/utils";
import { revalidateBrandConfig } from "@/lib/revalidate-brand";
import { fail, ok } from "@/utils/api-response";
import { prismaContains } from "@/lib/prisma-search";
import { normalizePagination } from "@/utils/pagination";
import { listClubsAdmin, listMatchesAdmin, listUsersAdmin } from "@/services/admin-crud.service";

const allowed = [
  "championships",
  "categories",
  "groups",
  "clubs",
  "staff_members",
  "athletes",
  "matches",
  "news",
  "banners",
  "documents",
  "users",
  "permissions",
  "audit_logs",
  "media_assets",
  "theme_configs",
  "brand_configs",
  "sponsors",
  "site_sections",
  "site_texts",
  "menu_items",
  "system_settings",
  "notifications",
] as const;

function notAllowed(entity: string) {
  return !allowed.includes(entity as (typeof allowed)[number]);
}

async function ensureAdmin() {
  const user = await getSessionUserOrThrow();
  const role = user.role.slug.toUpperCase();
  if (!hasRole(role, ["SUPER_ADMIN", "ADMIN_LIGA"])) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function GET(req: Request, { params }: { params: Promise<{ entity: string }> }) {
  try {
    await ensureAdmin();
    const { entity } = await params;
    if (notAllowed(entity)) {
      return fail("Entidade inválida", 404);
    }

    const url = new URL(req.url);
    const parsed = adminListQuerySchema.parse({
      q: url.searchParams.get("q") ?? undefined,
      page: url.searchParams.get("page") ?? 1,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
      categoryId: url.searchParams.get("categoryId") ?? undefined,
    });
    const { skip, pageSize } = normalizePagination(parsed);
    const contains = parsed.q ? prismaContains(parsed.q) : undefined;

    if (entity === "championships") {
      const [items, total] = await Promise.all([
        prisma.championship.findMany({
          where: contains ? { name: contains } : undefined,
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
        }),
        prisma.championship.count({ where: contains ? { name: contains } : undefined }),
      ]);
      return ok({ items, total });
    }
    if (entity === "categories") {
      const [items, total] = await Promise.all([
        prisma.category.findMany({
          where: contains ? { name: contains } : undefined,
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
          include: { championship: true },
        }),
        prisma.category.count({ where: contains ? { name: contains } : undefined }),
      ]);
      return ok({ items, total });
    }
    if (entity === "groups") {
      const groupWhere = contains
        ? {
            OR: [{ name: contains }, { category: { name: contains } }],
          }
        : undefined;
      const [items, total] = await Promise.all([
        prisma.group.findMany({
          where: groupWhere,
          orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
          skip,
          take: pageSize,
          include: {
            category: { include: { championship: { select: { id: true, name: true, season: true } } } },
          },
        }),
        prisma.group.count({ where: groupWhere }),
      ]);
      return ok({ items, total });
    }
    if (entity === "clubs") {
      const data = await listClubsAdmin(parsed.page, pageSize, parsed.q);
      return ok(data);
    }
    if (entity === "staff_members") {
      const where = contains ? { name: contains } : undefined;
      const [items, total] = await Promise.all([
        prisma.staffMember.findMany({
          where,
          orderBy: { name: "asc" },
          skip,
          take: pageSize,
          include: { club: true },
        }),
        prisma.staffMember.count({ where }),
      ]);
      return ok({ items, total });
    }
    if (entity === "athletes") {
      const athleteWhere = contains
        ? { OR: [{ firstName: contains }, { lastName: contains }] }
        : undefined;
      const [items, total] = await Promise.all([
        prisma.athlete.findMany({
          where: athleteWhere,
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
          include: { club: true },
        }),
        prisma.athlete.count({ where: athleteWhere }),
      ]);
      return ok({ items, total });
    }
    if (entity === "matches") {
      try {
        const data = await listMatchesAdmin(parsed.page, pageSize, {
          categoryId: parsed.categoryId,
          q: parsed.q,
        });
        return ok(data);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "";
        if (msg.includes("currentPhase") || msg.includes("does not exist")) {
          return fail(
            "Banco desatualizado: execute npx prisma db push no Railway (variável DATABASE_URL).",
            503
          );
        }
        throw error;
      }
    }
    if (entity === "news") {
      const [items, total] = await Promise.all([
        prisma.news.findMany({
          where: contains ? { title: contains } : undefined,
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
        }),
        prisma.news.count({ where: contains ? { title: contains } : undefined }),
      ]);
      return ok({ items, total });
    }
    if (entity === "banners") {
      const [items, total] = await Promise.all([
        prisma.banner.findMany({
          where: contains ? { title: contains } : undefined,
          orderBy: { order: "asc" },
          skip,
          take: pageSize,
        }),
        prisma.banner.count({ where: contains ? { title: contains } : undefined }),
      ]);
      return ok({ items, total });
    }
    if (entity === "documents") {
      const [items, total] = await Promise.all([
        prisma.document.findMany({
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
          include: { club: true },
        }),
        prisma.document.count(),
      ]);
      return ok({ items, total });
    }
    if (entity === "users") {
      const data = await listUsersAdmin(parsed.page, pageSize, parsed.q);
      return ok(data);
    }
    if (entity === "permissions") {
      const [items, total] = await Promise.all([
        prisma.permission.findMany({
          where: contains ? { code: contains } : undefined,
          orderBy: { code: "asc" },
          skip,
          take: pageSize,
        }),
        prisma.permission.count({ where: contains ? { code: contains } : undefined }),
      ]);
      return ok({ items, total });
    }
    if (entity === "media_assets") {
      const [items, total] = await Promise.all([
        prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, skip, take: pageSize }),
        prisma.mediaAsset.count(),
      ]);
      return ok({ items, total });
    }
    if (entity === "theme_configs") {
      const [items, total] = await Promise.all([
        prisma.themeConfig.findMany({ orderBy: { updatedAt: "desc" }, skip, take: pageSize }),
        prisma.themeConfig.count(),
      ]);
      return ok({ items, total });
    }
    if (entity === "brand_configs") {
      const [items, total] = await Promise.all([
        prisma.brandConfig.findMany({ orderBy: { updatedAt: "desc" }, skip, take: pageSize }),
        prisma.brandConfig.count(),
      ]);
      return ok({ items, total });
    }
    if (entity === "sponsors") {
      const [items, total] = await Promise.all([
        prisma.sponsor.findMany({ orderBy: { order: "asc" }, skip, take: pageSize }),
        prisma.sponsor.count(),
      ]);
      return ok({ items, total });
    }
    if (entity === "site_sections") {
      const [items, total] = await Promise.all([
        prisma.siteSection.findMany({ orderBy: { order: "asc" }, skip, take: pageSize }),
        prisma.siteSection.count(),
      ]);
      return ok({ items, total });
    }
    if (entity === "site_texts") {
      const [items, total] = await Promise.all([
        prisma.siteText.findMany({ orderBy: { updatedAt: "desc" }, skip, take: pageSize }),
        prisma.siteText.count(),
      ]);
      return ok({ items, total });
    }
    if (entity === "menu_items") {
      const [items, total] = await Promise.all([
        prisma.menuItem.findMany({ orderBy: { order: "asc" }, skip, take: pageSize }),
        prisma.menuItem.count(),
      ]);
      return ok({ items, total });
    }
    if (entity === "system_settings") {
      const [items, total] = await Promise.all([
        prisma.systemSetting.findMany({ orderBy: { updatedAt: "desc" }, skip, take: pageSize }),
        prisma.systemSetting.count(),
      ]);
      return ok({ items, total });
    }
    if (entity === "notifications") {
      const where = contains ? { title: contains } : undefined;
      const [items, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
          include: { user: { select: { email: true, name: true } } },
        }),
        prisma.notification.count({ where }),
      ]);
      return ok({ items, total });
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: { user: true },
      }),
      prisma.auditLog.count(),
    ]);
    return ok({ items, total });
  } catch (error) {
    return fail(formatPrismaError(error), 400);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ entity: string }> }) {
  try {
    await ensureAdmin();
    const { entity } = await params;
    if (notAllowed(entity) || entity === "audit_logs" || entity === "permissions") {
      return fail("Não permitido", 400);
    }
    const schema = ENTITY_SCHEMAS[entity];
    if (!schema) return fail("Schema não configurado para esta entidade", 400);
    const raw = await req.json();
    const parsed = schema.parse(raw);
    const payload = prepareAdminPayload(entity, parsed as Record<string, unknown>);

    if (entity === "clubs") {
      const baseSlug =
        (typeof payload.slug === "string" && payload.slug) ||
        (typeof payload.name === "string" ? slugify(payload.name) : "clube");
      payload.slug = await ensureUniqueClubSlug(baseSlug);
      const normalizedName = payload.normalizedName as string | undefined;
      if (normalizedName) {
        const duplicate = await prisma.club.findFirst({
          where: { normalizedName },
          select: { name: true },
        });
        if (duplicate) {
          return fail(
            `Já existe outro clube cadastrado com este nome (${duplicate.name}).`,
            409
          );
        }
      }
    }

    if (entity === "championships") return ok(await prisma.championship.create({ data: payload as never }), 201);
    if (entity === "categories") return ok(await prisma.category.create({ data: payload as never }), 201);
    if (entity === "groups") return ok(await prisma.group.create({ data: payload as never }), 201);
    if (entity === "clubs") return ok(await prisma.club.create({ data: payload as never }), 201);
    if (entity === "staff_members") return ok(await prisma.staffMember.create({ data: payload as never }), 201);
    if (entity === "athletes") return ok(await prisma.athlete.create({ data: payload as never }), 201);
    if (entity === "matches") return ok(await prisma.match.create({ data: payload as never }), 201);
    if (entity === "news") return ok(await prisma.news.create({ data: payload as never }), 201);
    if (entity === "banners") return ok(await prisma.banner.create({ data: payload as never }), 201);
    if (entity === "documents") return ok(await prisma.document.create({ data: payload as never }), 201);
    if (entity === "media_assets") return ok(await prisma.mediaAsset.create({ data: payload as never }), 201);
    if (entity === "theme_configs") return ok(await prisma.themeConfig.create({ data: payload as never }), 201);
    if (entity === "brand_configs") {
      const created = await prisma.brandConfig.create({ data: payload as never });
      revalidateBrandConfig();
      return ok(created, 201);
    }
    if (entity === "sponsors") return ok(await prisma.sponsor.create({ data: payload as never }), 201);
    if (entity === "site_sections") return ok(await prisma.siteSection.create({ data: payload as never }), 201);
    if (entity === "site_texts") return ok(await prisma.siteText.create({ data: payload as never }), 201);
    if (entity === "menu_items") return ok(await prisma.menuItem.create({ data: payload as never }), 201);
    if (entity === "system_settings") return ok(await prisma.systemSetting.create({ data: payload as never }), 201);
    if (entity === "notifications") return ok(await prisma.notification.create({ data: payload as never }), 201);
    return ok(await prisma.user.create({ data: payload as never }), 201);
  } catch (error) {
    return fail(formatPrismaError(error), 400);
  }
}
