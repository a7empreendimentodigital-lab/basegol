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
      { href: "/admin/banners", label: "Banners e patrocínios", icon: Image },
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

/** Menu lateral global do admin — admin do campeonato usa só o menu do campeonato. */
export function filterAdminNavForRole(
  groups: AdminNavGroup[],
  role?: string | null
): AdminNavGroup[] {
  const r = role?.toUpperCase();
  if (r !== "ADMIN_CAMPEONATO") return groups;
  return [
    {
      title: "Meu campeonato",
      items: [{ href: "/admin/campeonatos", label: "Painel do campeonato", icon: Trophy }],
    },
  ];
}

export function isAdminNavActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/placar-ao-vivo") {
    return pathname === href || pathname.startsWith("/admin/partida/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
