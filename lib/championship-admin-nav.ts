import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Pencil,
  Layers,
  Blocks,
  Shield,
  Calendar,
  Users,
  UserCog,
  Newspaper,
  Handshake,
  FileUp,
  ScrollText,
} from "lucide-react";

export type ChampionshipAdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  segment?: string;
};

export function buildChampionshipAdminNav(championshipId: string): ChampionshipAdminNavItem[] {
  const base = `/admin/campeonatos/${championshipId}`;
  return [
    { href: base, label: "Visão geral", icon: LayoutDashboard, segment: "" },
    { href: `${base}/editar`, label: "Editar", icon: Pencil, segment: "editar" },
    { href: `${base}/categorias`, label: "Categorias", icon: Layers, segment: "categorias" },
    { href: `${base}/grupos`, label: "Grupos", icon: Blocks, segment: "grupos" },
    { href: `${base}/clubes`, label: "Clubes", icon: Shield, segment: "clubes" },
    { href: `${base}/jogos`, label: "Jogos", icon: Calendar, segment: "jogos" },
    { href: `${base}/atletas`, label: "Atletas", icon: Users, segment: "atletas" },
    { href: `${base}/noticias`, label: "Notícias", icon: Newspaper, segment: "noticias" },
    { href: `${base}/patrocinadores`, label: "Patrocinadores", icon: Handshake, segment: "patrocinadores" },
    { href: `${base}/usuarios`, label: "Usuários", icon: UserCog, segment: "usuarios" },
    { href: `${base}/importar`, label: "Importar", icon: FileUp, segment: "importar" },
    { href: `${base}/importacao-log`, label: "Log de importação", icon: ScrollText, segment: "importacao-log" },
  ];
}

export function isChampionshipAdminNavActive(pathname: string, item: ChampionshipAdminNavItem) {
  if (!item.segment) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
