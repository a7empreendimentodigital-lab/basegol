import {
  isChampionshipAdminRole,
  isGlobalAdminRole,
  requireChampionshipAccess,
  userHasChampionshipAccess,
} from "@/lib/championship-access";

/** Papéis que podem gerenciar patrocinadores de campeonato (não inclui operador). */
export function isChampionshipSponsorManagerRole(role: string) {
  const r = role.toUpperCase();
  return isGlobalAdminRole(r) || isChampionshipAdminRole(r);
}

/** Super Admin e Admin da Liga: todos os campeonatos. */
export function canViewAllChampionshipSponsors(role: string) {
  return isGlobalAdminRole(role);
}

export async function canManageChampionshipSponsors(
  userId: string,
  role: string,
  championshipId: string
) {
  if (!isChampionshipSponsorManagerRole(role)) return false;
  if (isGlobalAdminRole(role)) return true;
  return userHasChampionshipAccess(userId, role, championshipId);
}

export async function assertCanManageChampionshipSponsors(
  userId: string,
  role: string,
  championshipId: string
) {
  const ok = await canManageChampionshipSponsors(userId, role, championshipId);
  if (!ok) throw new Error("FORBIDDEN");
}

export async function assertCanViewAllChampionshipSponsors(role: string) {
  if (!canViewAllChampionshipSponsors(role)) throw new Error("FORBIDDEN");
}
