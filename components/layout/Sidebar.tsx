"use client";

import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { PublicNavLinks } from "@/components/layout/PublicNavLinks";
import { SidebarFavorites, SidebarFooterLinks } from "@/components/layout/SidebarFooter";
import { parseChampionshipSlugFromPath, championshipPublicBase } from "@/lib/championship-public-nav";
import { isClubPortalRoute } from "@/lib/public-routes";
import { SidebarAdBanner } from "@/components/public/SidebarAdBanner";
import { ChampionshipSponsorsBlock } from "@/components/public/ChampionshipSponsorsBlock";
import type { PublicBannerDto } from "@/services/banner.service";

type SidebarProps = {
  leftBanner?: PublicBannerDto | null;
  isLoggedIn?: boolean;
  userRole?: string | null;
};

export function Sidebar({ leftBanner, isLoggedIn, userRole }: SidebarProps) {
  const pathname = usePathname() ?? "/";
  const championshipSlug = parseChampionshipSlugFromPath(pathname);
  const logoHref = championshipSlug ? championshipPublicBase(championshipSlug) : "/";

  if (
    pathname === "/login" ||
    pathname.startsWith("/admin") ||
    isClubPortalRoute(pathname) ||
    pathname.startsWith("/operador") ||
    pathname.startsWith("/partida")
  ) {
    return null;
  }

  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 md:flex-col md:fixed md:inset-y-0 border-r border-line bg-graphite/80 z-30">
      <div className="border-b border-line px-2 py-6 flex items-center justify-center min-h-[220px] shrink-0">
        <Logo href={logoHref} size="sidebar" className="w-full" />
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto p-3">
        <PublicNavLinks pathname={pathname ?? "/"} />

        <div className="pt-4 mt-2 border-t border-line">
          <SidebarFavorites isLoggedIn={isLoggedIn} />
        </div>
      </nav>

      {championshipSlug ? (
        <ChampionshipSponsorsBlock
          championshipSlug={championshipSlug}
          placement="SIDEBAR_LEFT"
          variant="left"
          className="shrink-0 p-3 border-t border-line"
        />
      ) : leftBanner ? (
        <div className="shrink-0 p-3 border-t border-line">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
            Patrocinador
          </p>
          <SidebarAdBanner banner={leftBanner} variant="left" />
        </div>
      ) : null}

      <div className="shrink-0 p-3 border-t border-line">
        <SidebarFooterLinks isLoggedIn={isLoggedIn} userRole={userRole} />
      </div>
    </aside>
  );
}
