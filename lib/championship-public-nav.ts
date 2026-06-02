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
import type { PublicNavItem } from "@/lib/public-nav";

/** Extrai o slug do campeonato em rotas `/campeonatos/[slug]/...`. */
export function parseChampionshipSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/campeonatos\/([^/]+)(?:\/|$)/);
  if (!match?.[1]) return null;
  if (match[1] === "page") return null;
  return decodeURIComponent(match[1]);
}

export function championshipPublicBase(slug: string) {
  return `/campeonatos/${slug}`;
}

/** Menu lateral / inferior dentro de um campeonato (mesmo visual da home antiga). */
export function buildChampionshipPublicNav(slug: string): PublicNavItem[] {
  const base = championshipPublicBase(slug);
  return [
    { href: base, label: "Início", icon: Home },
    { href: `${base}/jogos?status=LIVE`, label: "Ao vivo", icon: Radio },
    { href: `${base}/jogos?status=upcoming`, label: "Próximos jogos", icon: Calendar },
    { href: "/", label: "Campeonatos", icon: Trophy },
    { href: `${base}/clubes`, label: "Clubes", icon: Shield },
    { href: `${base}/classificacao`, label: "Tabelas", icon: ChartColumn },
    { href: "/favoritos", label: "Favoritos", icon: Star },
  ];
}

export function buildChampionshipBottomNav(slug: string): PublicNavItem[] {
  const base = championshipPublicBase(slug);
  return [
    { href: base, label: "Início", icon: Home },
    { href: `${base}/jogos?status=LIVE`, label: "Ao vivo", icon: Radio },
    { href: `${base}/jogos?status=upcoming`, label: "Próximos", icon: Calendar },
    { href: "/busca", label: "Buscar", icon: Search },
    { href: "/favoritos", label: "Favoritos", icon: Star },
  ];
}

export function isChampionshipPublicNavActive(pathname: string, href: string, slug: string) {
  const base = championshipPublicBase(slug);

  if (href === "/") {
    return pathname === "/";
  }
  if (href === base) {
    return pathname === base || pathname === `${base}/`;
  }
  if (href === "/favoritos" || href === "/busca") {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const hrefBase = href.split("?")[0];
  if (href.includes("?")) {
    return pathname.startsWith(hrefBase);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
