import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/access-control";

export type ChampionshipAccessRole =
  | "SUPER_ADMIN"
  | "ADMIN_LIGA"
  | "ADMIN_CAMPEONATO"
  | string;

export function isGlobalAdminRole(role: string) {
  return hasRole(role, ["SUPER_ADMIN", "ADMIN_LIGA"]);
}

export function isChampionshipAdminRole(role: string) {
  return role.toUpperCase() === "ADMIN_CAMPEONATO";
}

export async function getChampionshipIdsForUser(userId: string, role: string) {
  if (isGlobalAdminRole(role)) return null;
  if (!isChampionshipAdminRole(role)) return [];
  const rows = await prisma.championshipMember.findMany({
    where: { userId },
    select: { championshipId: true },
  });
  return rows.map((r) => r.championshipId);
}

export async function getPrimaryChampionshipIdForUser(userId: string, role: string) {
  const ids = await getChampionshipIdsForUser(userId, role);
  if (ids === null) return null;
  return ids[0] ?? null;
}

export async function userHasChampionshipAccess(
  userId: string,
  role: string,
  championshipId: string
) {
  if (isGlobalAdminRole(role)) return true;
  if (!isChampionshipAdminRole(role)) return false;
  const member = await prisma.championshipMember.findUnique({
    where: { userId_championshipId: { userId, championshipId } },
    select: { id: true },
  });
  return Boolean(member);
}

export async function requireChampionshipAccess(
  userId: string,
  role: string,
  championshipId: string
) {
  const ok = await userHasChampionshipAccess(userId, role, championshipId);
  if (!ok) throw new Error("FORBIDDEN");
}

export async function assertMatchInChampionship(matchIds: string[], championshipId: string) {
  if (matchIds.length === 0) return;
  const count = await prisma.match.count({
    where: {
      id: { in: matchIds },
      OR: [
        { championshipId },
        { group: { category: { championshipId } } },
      ],
    },
  });
  if (count !== matchIds.length) {
    throw new Error("MATCH_NOT_IN_CHAMPIONSHIP");
  }
}
