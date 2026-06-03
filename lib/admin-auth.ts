import { getSessionUserOrThrow } from "@/lib/access-control";
import {
  getChampionshipIdsForUser,
  isChampionshipAdminRole,
  isGlobalAdminRole,
  requireChampionshipAccess,
  userHasChampionshipAccess,
} from "@/lib/championship-access";
import { isChampionshipSponsorManagerRole } from "@/lib/championship-sponsor-access";

export type AdminContext = {
  user: Awaited<ReturnType<typeof getSessionUserOrThrow>>;
  role: string;
  isGlobalAdmin: boolean;
  isChampionshipAdmin: boolean;
  championshipIds: string[] | null;
};

export async function getAdminContext(): Promise<AdminContext> {
  const user = await getSessionUserOrThrow();
  const role = user.role.slug.toUpperCase();
  const isGlobalAdmin = isGlobalAdminRole(role);
  const isChampionshipAdmin = isChampionshipAdminRole(role);

  if (!isGlobalAdmin && !isChampionshipAdmin) {
    throw new Error("FORBIDDEN");
  }

  const championshipIds = await getChampionshipIdsForUser(user.id, role);

  return {
    user,
    role,
    isGlobalAdmin,
    isChampionshipAdmin,
    championshipIds,
  };
}

export async function requireGlobalAdmin() {
  const ctx = await getAdminContext();
  if (!ctx.isGlobalAdmin) throw new Error("FORBIDDEN");
  return ctx;
}

export async function requireChampionshipScopedAdmin(championshipId: string) {
  const ctx = await getAdminContext();
  if (ctx.isGlobalAdmin) return ctx;
  if (!ctx.isChampionshipAdmin) throw new Error("FORBIDDEN");
  await requireChampionshipAccess(ctx.user.id, ctx.role, championshipId);
  return ctx;
}

/** Patrocinadores: Super/Admin Liga (qualquer campeonato) ou Admin do Campeonato (só o vinculado). */
export async function requireChampionshipSponsorAdmin(championshipId: string) {
  const ctx = await getAdminContext();
  if (!isChampionshipSponsorManagerRole(ctx.role)) throw new Error("FORBIDDEN");
  if (ctx.isGlobalAdmin) return ctx;
  if (!ctx.isChampionshipAdmin) throw new Error("FORBIDDEN");
  await requireChampionshipAccess(ctx.user.id, ctx.role, championshipId);
  return ctx;
}

export async function canManageChampionship(
  userId: string,
  role: string,
  championshipId: string
) {
  return userHasChampionshipAccess(userId, role, championshipId);
}

/** Entidades que o admin do campeonato pode usar no CRUD genérico. */
export const CHAMPIONSHIP_ADMIN_CRUD_ENTITIES = [
  "championships",
  "categories",
  "groups",
  "clubs",
  "staff_members",
  "athletes",
  "matches",
  "news",
] as const;

export function assertCrudEntityForChampionshipAdmin(entity: string) {
  if (
    !CHAMPIONSHIP_ADMIN_CRUD_ENTITIES.includes(
      entity as (typeof CHAMPIONSHIP_ADMIN_CRUD_ENTITIES)[number]
    )
  ) {
    throw new Error("FORBIDDEN");
  }
}

export function enforceChampionshipIdForScopedAdmin(
  ctx: AdminContext,
  championshipId: string | undefined | null
): string {
  if (ctx.isGlobalAdmin) {
    if (!championshipId) throw new Error("CHAMPIONSHIP_ID_REQUIRED");
    return championshipId;
  }
  const allowed = ctx.championshipIds ?? [];
  if (allowed.length === 0) throw new Error("FORBIDDEN");
  if (championshipId && !allowed.includes(championshipId)) {
    throw new Error("FORBIDDEN");
  }
  return championshipId ?? allowed[0]!;
}

export async function ensureAdminApi(championshipId?: string | null) {
  const ctx = await getAdminContext();
  if (ctx.isGlobalAdmin) return ctx;
  if (championshipId) {
    await requireChampionshipAccess(ctx.user.id, ctx.role, championshipId);
  }
  return ctx;
}

export function canCreateRole(actorRole: string, targetRole: string) {
  const actor = actorRole.toUpperCase();
  const target = targetRole.toUpperCase();
  if (target === "VISITANTE" || target === "SUPER_ADMIN") return false;
  if (actor === "SUPER_ADMIN") {
    return ["ADMIN_LIGA", "ADMIN_CAMPEONATO", "OPERADOR_DE_PARTIDA", "CLUBE", "SCOUT"].includes(
      target
    );
  }
  if (actor === "ADMIN_LIGA") {
    return ["ADMIN_CAMPEONATO", "OPERADOR_DE_PARTIDA", "CLUBE", "SCOUT"].includes(target);
  }
  if (actor === "ADMIN_CAMPEONATO") {
    return target === "OPERADOR_DE_PARTIDA";
  }
  return false;
}
