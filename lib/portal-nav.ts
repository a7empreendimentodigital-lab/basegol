import { isAppRole } from "@/lib/rbac";

export type PortalArea = "public" | "admin" | "clube" | "operador" | "scout";

export type StaffPanelItem = {
  href: string;
  label: string;
};

const PANEL_ACCESS: { item: StaffPanelItem; roles: string[] }[] = [
  { item: { href: "/admin", label: "Painel admin" }, roles: ["SUPER_ADMIN", "ADMIN_LIGA"] },
  { item: { href: "/clube", label: "Área do clube" }, roles: ["SUPER_ADMIN", "ADMIN_LIGA", "CLUBE"] },
  {
    item: { href: "/operador", label: "Operação de partida" },
    roles: ["SUPER_ADMIN", "ADMIN_LIGA", "OPERADOR_DE_PARTIDA"],
  },
  { item: { href: "/estatisticas", label: "Área scout" }, roles: ["SCOUT"] },
];

function isCurrentPanel(panel: StaffPanelItem, area: PortalArea): boolean {
  if (area === "admin") return panel.href === "/admin";
  if (area === "clube") return panel.href === "/clube";
  if (area === "operador") return panel.href === "/operador";
  if (area === "scout") return panel.href === "/estatisticas";
  return false;
}

/** Painéis internos que o papel pode abrir. */
export function getStaffPanelsForRole(role?: string | null): StaffPanelItem[] {
  const r = role?.toUpperCase();
  if (!r || !isAppRole(r)) return [];
  return PANEL_ACCESS.filter((entry) => entry.roles.includes(r)).map((entry) => entry.item);
}

export function isStaffRole(role?: string | null): boolean {
  return getStaffPanelsForRole(role).length > 0;
}

export function portalAreaFromPathname(pathname: string): PortalArea {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname === "/clube" || pathname.startsWith("/clube/")) return "clube";
  if (pathname.startsWith("/operador") || pathname.startsWith("/partida")) return "operador";
  if (pathname.startsWith("/estatisticas")) return "scout";
  return "public";
}

export function staffPanelsForContext(
  role: string | null | undefined,
  currentArea: PortalArea
): StaffPanelItem[] {
  return getStaffPanelsForRole(role).filter((panel) => !isCurrentPanel(panel, currentArea));
}
