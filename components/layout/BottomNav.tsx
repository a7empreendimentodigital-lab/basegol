"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  buildChampionshipBottomNav,
  isChampionshipPublicNavActive,
} from "@/lib/championship-public-nav";
import { usePortalChampionshipSlug } from "@/hooks/use-portal-championship-slug";
import { PUBLIC_BOTTOM_NAV, isPublicNavActive } from "@/lib/public-nav";
import { isPublicAppRoute } from "@/lib/public-routes";

export function BottomNav() {
  const pathname = usePathname() ?? "";
  const championshipSlug = usePortalChampionshipSlug();

  if (!isPublicAppRoute(pathname)) {
    return null;
  }
  const navItems = championshipSlug
    ? buildChampionshipBottomNav(championshipSlug)
    : PUBLIC_BOTTOM_NAV;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-pitch/95 backdrop-blur-xl md:hidden pb-safe"
      suppressHydrationWarning
    >
      <div className="flex h-14 items-center justify-around px-1 max-w-lg mx-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = championshipSlug
            ? isChampionshipPublicNavActive(pathname, href, championshipSlug)
            : isPublicNavActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-11 min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors active:scale-[0.97] active:opacity-80",
                active ? "text-selected" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="max-w-[64px] truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
