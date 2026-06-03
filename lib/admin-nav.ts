import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Trophy,
  Users,
  ActivitySquare,
  Image,
  Palette,
  ImagePlus,
  Menu,
  KeyRound,
  BarChart3,
  ScrollText,
  Bell,
  Handshake,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

/** Itens legados — gestão por campeonato está em `/admin/campeonatos/[id]`. */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [];

function isGlobalAdminRole(role?: string | null) {
  const r = role?.toUpperCase();
  return r === "SUPER_ADMIN" || r === "ADMIN_LIGA";
}

/** Dentro da gestão de um campeonato específico. */
export function isInsideChampionshipAdmin(pathname: string) {
  return /^\/admin\/campeonatos\/[^/]+(?:\/|$)/.test(pathname);
}

function buildGlobalAdminNav(): AdminNavGroup[] {
  return [
    {
      title: "Principal",
      items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      title: "Gestão",
      items: [
        { href: "/admin/campeonatos", label: "Campeonatos", icon: Trophy },
        { href: "/admin/placar-ao-vivo", label: "Placar ao vivo", icon: ActivitySquare },
        { href: "/admin/patrocinadores", label: "Patrocinadores (global)", icon: Handshake },
        { href: "/admin/usuarios", label: "Usuários", icon: Users },
        { href: "/admin/permissoes", label: "Permissões", icon: KeyRound },
      ],
    },
    {
      title: "Portal",
      items: [
        { href: "/admin/banners", label: "Banners", icon: Image },
        { href: "/admin/personalizacao", label: "Marca e identidade", icon: Palette },
        { href: "/admin/menu", label: "Menu público", icon: Menu },
        { href: "/admin/midia", label: "Mídia", icon: ImagePlus },
      ],
    },
    {
      title: "Sistema",
      items: [
        { href: "/admin/tema", label: "Tema", icon: Palette },
        { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
        { href: "/admin/audit-log", label: "Audit log", icon: ScrollText },
        { href: "/admin/notificacoes", label: "Notificações", icon: Bell },
      ],
    },
  ];
}

/** Barra lateral global mínima enquanto edita um campeonato (menu completo fica no painel do campeonato). */
function buildChampionshipContextGlobalNav(): AdminNavGroup[] {
  return [
    {
      title: "Principal",
      items: [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/campeonatos", label: "Todos os campeonatos", icon: Trophy },
        { href: "/admin/placar-ao-vivo", label: "Placar ao vivo", icon: ActivitySquare },
      ],
    },
  ];
}

function buildChampionshipAdminSidebarNav(championshipId: string): AdminNavGroup[] {
  return [
    {
      title: "Principal",
      items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      title: "Meu campeonato",
      items: [
        {
          href: `/admin/campeonatos/${championshipId}`,
          label: "Abrir gestão",
          icon: Trophy,
        },
      ],
    },
  ];
}

export type AdminNavContext = {
  role?: string | null;
  championshipId?: string | null;
  pathname?: string;
};

/** Menu lateral global do admin, por papel e rota. */
export function buildAdminNavForRole(ctx: AdminNavContext): AdminNavGroup[] {
  const r = ctx.role?.toUpperCase();
  const pathname = ctx.pathname ?? "";

  if (isInsideChampionshipAdmin(pathname)) {
    return buildChampionshipContextGlobalNav();
  }

  if (r === "ADMIN_CAMPEONATO") {
    if (ctx.championshipId) {
      return buildChampionshipAdminSidebarNav(ctx.championshipId);
    }
    return [
      {
        title: "Meu campeonato",
        items: [{ href: "/admin/campeonatos", label: "Campeonatos", icon: Trophy }],
      },
    ];
  }

  if (isGlobalAdminRole(r)) {
    return buildGlobalAdminNav();
  }

  return buildGlobalAdminNav();
}

/** @deprecated Use buildAdminNavForRole */
export function filterAdminNavForRole(
  groups: AdminNavGroup[],
  role?: string | null
): AdminNavGroup[] {
  void groups;
  return buildAdminNavForRole({ role });
}

export function isAdminNavActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/placar-ao-vivo") {
    return pathname === href || pathname.startsWith("/admin/partida/");
  }
  if (href === "/admin/campeonatos") {
    return (
      pathname === href ||
      (pathname.startsWith(`${href}/`) && !pathname.startsWith("/admin/campeonatos/novo"))
    );
  }
  if (href === "/admin/patrocinadores") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
