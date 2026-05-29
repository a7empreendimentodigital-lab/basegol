import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ENTITY_SCHEMAS } from "@/utils/zod-schemas/admin-entities";
import { prepareAdminPayload } from "@/lib/admin-transform";
import { fail, ok } from "@/utils/api-response";

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

async function ensureAdmin() {
  const user = await getSessionUserOrThrow();
  const role = user.role.slug.toUpperCase();
  if (!hasRole(role, ["SUPER_ADMIN", "ADMIN_LIGA"])) {
    throw new Error("FORBIDDEN");
  }
}

async function softDeleteFallback(entity: string, id: string) {
  if (entity === "clubs") {
    await prisma.club.update({ where: { id }, data: { status: "SUSPENDED" } });
    return true;
  }
  if (entity === "categories") {
    await prisma.category.update({ where: { id }, data: { status: "INACTIVE" } });
    return true;
  }
  if (entity === "groups") {
    await prisma.group.update({ where: { id }, data: { status: "INACTIVE" } });
    return true;
  }
  if (entity === "championships") {
    await prisma.championship.update({ where: { id }, data: { status: "CANCELLED" } });
    return true;
  }
  if (entity === "staff_members") {
    await prisma.staffMember.update({ where: { id }, data: { status: "INACTIVE" } });
    return true;
  }
  if (entity === "athletes") {
    await prisma.athlete.update({ where: { id }, data: { status: "INACTIVE" } });
    return true;
  }
  return false;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ entity: string; id: string }> }
) {
  try {
    await ensureAdmin();
    const { entity, id } = await params;
    if (!allowed.includes(entity as (typeof allowed)[number])) {
      return fail("Entidade inválida", 404);
    }
    const schema = ENTITY_SCHEMAS[entity];
    if (!schema) return fail("Schema não configurado", 400);
    const raw = await req.json();
    const parsed = schema.partial().parse(raw);
    const payload = prepareAdminPayload(entity, parsed as Record<string, unknown>);
    if (entity === "championships") return ok(await prisma.championship.update({ where: { id }, data: payload as never }));
    if (entity === "categories") return ok(await prisma.category.update({ where: { id }, data: payload as never }));
    if (entity === "groups") return ok(await prisma.group.update({ where: { id }, data: payload as never }));
    if (entity === "clubs") return ok(await prisma.club.update({ where: { id }, data: payload as never }));
    if (entity === "staff_members") return ok(await prisma.staffMember.update({ where: { id }, data: payload as never }));
    if (entity === "athletes") return ok(await prisma.athlete.update({ where: { id }, data: payload as never }));
    if (entity === "matches") return ok(await prisma.match.update({ where: { id }, data: payload as never }));
    if (entity === "news") return ok(await prisma.news.update({ where: { id }, data: payload as never }));
    if (entity === "banners") return ok(await prisma.banner.update({ where: { id }, data: payload as never }));
    if (entity === "documents") return ok(await prisma.document.update({ where: { id }, data: payload as never }));
    if (entity === "media_assets") return ok(await prisma.mediaAsset.update({ where: { id }, data: payload as never }));
    if (entity === "theme_configs") return ok(await prisma.themeConfig.update({ where: { id }, data: payload as never }));
    if (entity === "brand_configs") return ok(await prisma.brandConfig.update({ where: { id }, data: payload as never }));
    if (entity === "sponsors") return ok(await prisma.sponsor.update({ where: { id }, data: payload as never }));
    if (entity === "site_sections") return ok(await prisma.siteSection.update({ where: { id }, data: payload as never }));
    if (entity === "site_texts") return ok(await prisma.siteText.update({ where: { id }, data: payload as never }));
    if (entity === "menu_items") return ok(await prisma.menuItem.update({ where: { id }, data: payload as never }));
    if (entity === "system_settings") return ok(await prisma.systemSetting.update({ where: { id }, data: payload as never }));
    if (entity === "notifications") return ok(await prisma.notification.update({ where: { id }, data: payload as never }));
    return ok(await prisma.user.update({ where: { id }, data: payload as never }));
  } catch (error) {
    return fail("Falha ao atualizar", 400, error instanceof Error ? error.message : undefined);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ entity: string; id: string }> }
) {
  try {
    await ensureAdmin();
    const { entity, id } = await params;
    if (!allowed.includes(entity as (typeof allowed)[number])) {
      return fail("Entidade inválida", 404);
    }
    if (entity === "championships") await prisma.championship.delete({ where: { id } });
    else if (entity === "categories") await prisma.category.delete({ where: { id } });
    else if (entity === "groups") await prisma.group.delete({ where: { id } });
    else if (entity === "clubs") await prisma.club.delete({ where: { id } });
    else if (entity === "staff_members") await prisma.staffMember.delete({ where: { id } });
    else if (entity === "athletes") await prisma.athlete.delete({ where: { id } });
    else if (entity === "matches") await prisma.match.delete({ where: { id } });
    else if (entity === "news") await prisma.news.delete({ where: { id } });
    else if (entity === "banners") await prisma.banner.delete({ where: { id } });
    else if (entity === "documents") await prisma.document.delete({ where: { id } });
    else if (entity === "media_assets") await prisma.mediaAsset.delete({ where: { id } });
    else if (entity === "theme_configs") await prisma.themeConfig.delete({ where: { id } });
    else if (entity === "brand_configs") await prisma.brandConfig.delete({ where: { id } });
    else if (entity === "sponsors") await prisma.sponsor.delete({ where: { id } });
    else if (entity === "site_sections") await prisma.siteSection.delete({ where: { id } });
    else if (entity === "site_texts") await prisma.siteText.delete({ where: { id } });
    else if (entity === "menu_items") await prisma.menuItem.delete({ where: { id } });
    else if (entity === "system_settings") await prisma.systemSetting.delete({ where: { id } });
    else if (entity === "notifications") await prisma.notification.delete({ where: { id } });
    else await prisma.user.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2003" || error.code === "P2014")
    ) {
      try {
        const { entity, id } = await params;
        const softDeleted = await softDeleteFallback(entity, id);
        if (softDeleted) {
          return ok({ deleted: true, softDeleted: true });
        }
      } catch {
        // fallback handled below
      }
      return fail("Registro possui vínculos e não pode ser excluído fisicamente", 409);
    }
    return fail("Falha ao excluir", 400, error instanceof Error ? error.message : undefined);
  }
}
