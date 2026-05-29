"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import { SidebarFavorites, SidebarFooterLinks } from "@/components/layout/SidebarFooter";
import { PUBLIC_MAIN_NAV, isPublicNavActive } from "@/lib/public-nav";
import { isClubPortalRoute } from "@/lib/public-routes";
import { SidebarAdBanner } from "@/components/public/SidebarAdBanner";
import type { PublicBannerDto } from "@/services/banner.service";

type SidebarProps = {
  leftBanner?: PublicBannerDto | null;
  isLoggedIn?: boolean;
};

export function Sidebar({ leftBanner, isLoggedIn }: SidebarProps) {
  const pathname = usePathname();

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
        <Logo size="sidebar" className="w-full" />
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto p-3 space-y-0.5">
        {PUBLIC_MAIN_NAV.map(({ href, label, icon: Icon }) => {
          const active = isPublicNavActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "nav-active"
                  : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}

        <div className="pt-4 mt-2 border-t border-line">
          <SidebarFavorites isLoggedIn={isLoggedIn} />
        </div>
      </nav>

      {leftBanner ? (
        <div className="shrink-0 p-3 border-t border-line">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
            Patrocinador
          </p>
          <SidebarAdBanner banner={leftBanner} variant="left" />
        </div>
      ) : null}

      <div className="shrink-0 p-3 border-t border-line">
        <SidebarFooterLinks isLoggedIn={isLoggedIn} />
      </div>
    </aside>
  );
}
