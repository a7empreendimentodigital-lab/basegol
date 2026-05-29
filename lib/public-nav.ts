import {
  Home,
  Radio,
  Calendar,
  Trophy,
  ChartColumn,
  Star,
  Search,
  Shield,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PublicNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const PUBLIC_MAIN_NAV: PublicNavItem[] = [
  { href: "/", label: "Início", icon: Home },
  { href: "/jogos?status=LIVE", label: "Ao vivo", icon: Radio },
  { href: "/jogos?status=upcoming", label: "Próximos jogos", icon: Calendar },
  { href: "/campeonatos", label: "Campeonatos", icon: Trophy },
  { href: "/clubes", label: "Clubes", icon: Shield },
  { href: "/tabela", label: "Tabelas", icon: ChartColumn },
  { href: "/favoritos", label: "Favoritos", icon: Star },
];

export const PUBLIC_BOTTOM_NAV: PublicNavItem[] = [
  { href: "/", label: "Início", icon: Home },
  { href: "/jogos?status=LIVE", label: "Ao vivo", icon: Radio },
  { href: "/jogos?status=upcoming", label: "Próximos", icon: Calendar },
  { href: "/busca", label: "Buscar", icon: Search },
  { href: "/favoritos", label: "Favoritos", icon: Star },
];

export function isPublicNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  const base = href.split("?")[0];
  if (href.includes("?")) {
    return pathname.startsWith(base);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
