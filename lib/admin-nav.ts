import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Trophy,
  Layers,
  Blocks,
  Shield,
  Users,
  Calendar,
  ActivitySquare,
  Newspaper,
  Image,
  Palette,
  ImagePlus,
  Menu,
  KeyRound,
  BarChart3,
  ScrollText,
  Bell,
  FileUp,
  Handshake,
  UserCog,
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

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    title: "Principal",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Competição",
    items: [
      { href: "/admin/campeonatos", label: "Campeonatos", icon: Trophy },
      { href: "/admin/categorias", label: "Categorias", icon: Layers },
      { href: "/admin/grupos", label: "Grupos", icon: Blocks },
      { href: "/admin/jogos", label: "Jogos", icon: Calendar },
      { href: "/admin/importacao-paulista", label: "Importar pacote Paulista", icon: FileUp },
      { href: "/admin/importacao-tabela", label: "Importar tabela PDF", icon: FileUp },
      { href: "/admin/importacao-jogos", label: "Importar jogos", icon: Calendar },
      { href: "/admin/importacao-atletas", label: "Importar atletas", icon: FileUp },
      { href: "/admin/importacao-resultados", label: "Importar resultados", icon: FileUp },
      { href: "/admin/placar-ao-vivo", label: "Placar ao vivo", icon: ActivitySquare },
    ],
  },
  {
    title: "Cadastros",
    items: [
      { href: "/admin/clubes", label: "Clubes", icon: Shield },
      { href: "/admin/atletas", label: "Atletas", icon: Users },
      { href: "/admin/comissao", label: "Comissão", icon: Users },
    ],
  },
  {
    title: "Conteúdo",
    items: [
      { href: "/admin/noticias", label: "Notícias", icon: Newspaper },
      { href: "/admin/banners", label: "Banners", icon: Image },
      { href: "/admin/patrocinadores", label: "Patrocinadores", icon: Handshake },
      { href: "/admin/midia", label: "Mídia", icon: ImagePlus },
      { href: "/admin/menu", label: "Menu público", icon: Menu },
    ],
  },
  {
    title: "Sistema",
    items: [
      { href: "/admin/personalizacao", label: "Marca e identidade", icon: Palette },
      { href: "/admin/tema", label: "Tema", icon: Palette },
      { href: "/admin/usuarios", label: "Usuários", icon: Users },
      { href: "/admin/permissoes", label: "Permissões", icon: KeyRound },
      { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
      { href: "/admin/audit-log", label: "Audit log", icon: ScrollText },
      { href: "/admin/notificacoes", label: "Notificações", icon: Bell },
    ],
  },
];

const GLOBAL_MANAGEMENT_HREFS = new Set([
  "/admin/campeonatos",
  "/admin/patrocinadores",
  "/admin/usuarios",
  "/admin/permissoes",
]);

function isGlobalAdminRole(role?: string | null) {
  const r = role?.toUpperCase();
  return r === "SUPER_ADMIN" || r === "ADMIN_LIGA";
}

function omitItems(groups: AdminNavGroup[], hrefs: Set<string>): AdminNavGroup[] {
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => !hrefs.has(item.href)),
    }))
    .filter((g) => g.items.length > 0);
}

function buildGlobalAdminNav(): AdminNavGroup[] {
  const gestao: AdminNavGroup = {
    title: "Gestão",
    items: [
      { href: "/admin/campeonatos", label: "Campeonatos", icon: Trophy },
      { href: "/admin/patrocinadores", label: "Patrocinadores", icon: Handshake },
      { href: "/admin/usuarios", label: "Usuários", icon: Users },
      { href: "/admin/permissoes", label: "Permissões", icon: KeyRound },
    ],
  };

  const rest = omitItems(ADMIN_NAV_GROUPS, GLOBAL_MANAGEMENT_HREFS);
  const principal = rest.find((g) => g.title === "Principal");
  const others = rest.filter((g) => g.title !== "Principal");

  return [...(principal ? [principal] : []), gestao, ...others];
}

function buildChampionshipAdminNav(championshipId: string): AdminNavGroup[] {
  const base = `/admin/campeonatos/${championshipId}`;
  return [
    {
      title: "Principal",
      items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      title: "Meu campeonato",
      items: [
        { href: base, label: "Campeonato", icon: Trophy },
        { href: `${base}/patrocinadores`, label: "Patrocinadores", icon: Handshake },
        { href: `${base}/usuarios`, label: "Usuários", icon: UserCog },
        { href: `${base}/categorias`, label: "Categorias", icon: Layers },
        { href: `${base}/grupos`, label: "Grupos", icon: Blocks },
        { href: `${base}/clubes`, label: "Clubes", icon: Shield },
        { href: `${base}/jogos`, label: "Jogos", icon: Calendar },
        { href: `${base}/atletas`, label: "Atletas", icon: Users },
        { href: `${base}/noticias`, label: "Notícias", icon: Newspaper },
      ],
    },
  ];
}

export type AdminNavContext = {
  role?: string | null;
  championshipId?: string | null;
};

/** Menu lateral global do admin, por papel. */
export function buildAdminNavForRole(ctx: AdminNavContext): AdminNavGroup[] {
  const r = ctx.role?.toUpperCase();

  if (r === "ADMIN_CAMPEONATO") {
    if (ctx.championshipId) {
      return buildChampionshipAdminNav(ctx.championshipId);
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

  return ADMIN_NAV_GROUPS;
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
