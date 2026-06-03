export const APP_ROLES = [
  "SUPER_ADMIN",
  "ADMIN_LIGA",
  "ADMIN_CAMPEONATO",
  "CLUBE",
  "OPERADOR_DE_PARTIDA",
  "SCOUT",
  "VISITANTE",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN_LIGA: [
    "championship:*",
    "club:*",
    "match:*",
    "news:*",
    "standing:*",
    "document:read",
    "user:read",
  ],
  ADMIN_CAMPEONATO: [
    "championship:scoped:*",
    "club:*",
    "match:*",
    "news:*",
    "standing:*",
    "sponsor:scoped:*",
    "user:scoped:read",
  ],
  CLUBE: [
    "club:own:*",
    "athlete:own:*",
    "staff:own:*",
    "document:own:*",
    "registration:own:*",
    "lineup:suggest",
  ],
  OPERADOR_DE_PARTIDA: [
    "match:update-live",
    "match:event:*",
    "match:stat:*",
    "match:lifecycle:*",
    "news:read",
  ],
  SCOUT: ["athlete:read", "statistics:read", "public:read"],
  VISITANTE: ["public:read"],
};

export function isAppRole(value?: string): value is AppRole {
  return APP_ROLES.includes((value ?? "") as AppRole);
}

export function hasPermission(role: string, permission: string): boolean {
  if (!isAppRole(role)) return false;
  const perms = ROLE_PERMISSIONS[role];
  if (perms.includes("*")) return true;
  return perms.some(
    (p) =>
      p === permission ||
      p.endsWith(":*") && permission.startsWith(p.replace(":*", ":")) ||
      p === "public:read" && permission.startsWith("public:")
  );
}

import { isClubPortalRoute } from "@/lib/public-routes";

export function canAccessRoute(
  role: string,
  pathname: string,
  options?: { championshipId?: string | null }
): boolean {
  if (!isAppRole(role)) return false;
  if (pathname.startsWith("/admin")) {
    if (["SUPER_ADMIN", "ADMIN_LIGA"].includes(role)) return true;
    if (role === "ADMIN_CAMPEONATO") {
      const cid = options?.championshipId;
      if (!cid) {
        return (
          pathname === "/admin" ||
          pathname === "/admin/campeonatos" ||
          pathname.startsWith("/admin/campeonatos/")
        );
      }
      return pathname.startsWith(`/admin/campeonatos/${cid}`);
    }
    return false;
  }
  if (isClubPortalRoute(pathname)) {
    return ["SUPER_ADMIN", "CLUBE", "ADMIN_LIGA"].includes(role);
  }
  if (pathname.startsWith("/operador") || pathname.startsWith("/partida")) {
    return ["SUPER_ADMIN", "OPERADOR_DE_PARTIDA", "ADMIN_LIGA"].includes(role);
  }
  if (pathname.startsWith("/scout")) {
    return ["SUPER_ADMIN", "SCOUT", "ADMIN_LIGA"].includes(role);
  }
  return true;
}
