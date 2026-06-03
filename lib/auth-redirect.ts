import { getCanonicalOrigin, normalizeCallbackPath } from "@/lib/app-origin";
import { canAccessRoute } from "@/lib/rbac";

export function redirectPathForRole(role?: string, mustChangePassword?: boolean) {
  if (mustChangePassword) return "/primeiro-acesso/trocar-senha";
  switch (role?.toUpperCase()) {
    case "SUPER_ADMIN":
    case "ADMIN_LIGA":
      return "/admin";
    case "ADMIN_CAMPEONATO":
      return "/admin";
    case "CLUBE":
      return "/clube";
    case "OPERADOR_DE_PARTIDA":
      return "/operador";
    case "SCOUT":
      return "/";
    default:
      return "/";
  }
}

type ResolvePostLoginInput = {
  role?: string;
  mustChangePassword?: boolean;
  callbackUrl?: string | null;
  /** URL base da requisição (ex.: http://localhost:3000) */
  origin: string;
};

export function resolvePostLoginPath({
  role,
  mustChangePassword,
  callbackUrl,
  origin,
  championshipId,
}: ResolvePostLoginInput & { championshipId?: string | null }): string {
  let defaultPath = redirectPathForRole(role, mustChangePassword);
  if (role?.toUpperCase() === "ADMIN_CAMPEONATO" && championshipId && !mustChangePassword) {
    defaultPath = `/admin/campeonatos/${championshipId}`;
  }

  const canonicalOrigin = getCanonicalOrigin(origin);
  const callbackPath = normalizeCallbackPath(callbackUrl, origin);

  if (mustChangePassword || !callbackPath) {
    return defaultPath;
  }

  try {
    const target = new URL(callbackPath, canonicalOrigin);
    const roleUpper = role?.toUpperCase() ?? "";

    const path = `${target.pathname}${target.search}`;
    if (canAccessRoute(roleUpper, target.pathname)) {
      return path;
    }
  } catch {
    /* URL inválida */
  }

  return defaultPath;
}
