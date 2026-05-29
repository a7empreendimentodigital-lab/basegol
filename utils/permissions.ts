const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN_LIGA: ["championship:*", "club:*", "match:*", "news:*", "standing:*"],
  CLUBE: ["club:own:*", "athlete:own:*", "document:own:*"],
  OPERADOR_DE_PARTIDA: ["match:update-live", "match:event:*", "match:stat:*"],
  SCOUT: ["athlete:read", "statistics:read"],
  VISITANTE: ["public:read"],
};

export function hasPermission(role: string, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] ?? [];
  if (perms.includes("*")) return true;
  return perms.some(
    (p) =>
      p === permission ||
      p === `${permission.split(":")[0]}:*` ||
      (p === "public:read" && permission.startsWith("public:"))
  );
}
