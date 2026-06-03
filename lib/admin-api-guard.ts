import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import {
  assertCrudEntityForChampionshipAdmin,
  enforceChampionshipIdForScopedAdmin,
  getAdminContext,
  type AdminContext,
} from "@/lib/admin-auth";

/** Apenas Super Admin e Admin da Liga (rotas globais, importações, usuários globais). */
export async function ensureGlobalAdmin() {
  const user = await getSessionUserOrThrow();
  const role = user.role.slug.toUpperCase();
  if (!hasRole(role, ["SUPER_ADMIN", "ADMIN_LIGA"])) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

/** CRUD e APIs com escopo opcional por campeonato. */
export async function ensureAdminCrud(
  entity: string,
  championshipId?: string | null
): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (ctx.isChampionshipAdmin) {
    assertCrudEntityForChampionshipAdmin(entity);
    enforceChampionshipIdForScopedAdmin(ctx, championshipId);
  }
  return ctx;
}
