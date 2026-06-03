"use client";

import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { PublicNavLinks } from "@/components/layout/PublicNavLinks";
import { SidebarFavorites, SidebarFooterLinks } from "@/components/layout/SidebarFooter";
import { championshipPublicBase } from "@/lib/championship-public-nav";
import { usePortalChampionshipSlug } from "@/hooks/use-portal-championship-slug";
import { isClubPortalRoute } from "@/lib/public-routes";
import { ChampionshipSponsorsBlock } from "@/components/public/ChampionshipSponsorsBlock";

type SidebarProps = {
  leftBanner?: unknown;
  isLoggedIn?: boolean;
  userRole?: string | null;
  userChampionshipId?: string | null;
};

export function Sidebar({ isLoggedIn, userRole, userChampionshipId }: SidebarProps) {
  const pathname = usePathname() ?? "/";
  const championshipSlug = usePortalChampionshipSlug();
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
    <aside className="hidden md:flex md:w-64 lg:w-72 md:flex-col md:fixed md:inset-y-0 md:min-h-0 border-r border-line bg-graphite/80 z-30">
      <div className="flex shrink-0 items-center justify-center border-b border-line px-3 pt-6 pb-8 min-h-[180px] max-h-[220px]">
        <Logo href={logoHref} size="sidebar" className="w-full pb-2" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <nav className="shrink-0 p-3">
          <PublicNavLinks pathname={pathname ?? "/"} />

          <div className="mt-2 border-t border-line pt-4">
            <SidebarFavorites isLoggedIn={isLoggedIn} />
          </div>
        </nav>

        {championshipSlug ? (
          <ChampionshipSponsorsBlock
            championshipSlug={championshipSlug}
            placement="SIDEBAR_LEFT"
            variant="left"
            className="mt-auto shrink-0 border-t border-line px-3 pt-4 pb-5"
          />
        ) : null}
      </div>

      <div className="shrink-0 border-t border-line p-3">
        <SidebarFooterLinks
          isLoggedIn={isLoggedIn}
          userRole={userRole}
          userChampionshipId={userChampionshipId}
        />
      </div>
    </aside>
  );
}
