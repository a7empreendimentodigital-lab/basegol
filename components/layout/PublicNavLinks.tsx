"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildChampionshipPublicNav,
  isChampionshipPublicNavActive,
} from "@/lib/championship-public-nav";
import { usePortalChampionshipSlug } from "@/hooks/use-portal-championship-slug";
import { PUBLIC_MAIN_NAV, isPublicNavActive } from "@/lib/public-nav";

type Props = {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
  variant?: "sidebar" | "drawer";
};

function NavLinkLabel({
  label,
  icon: Icon,
  isDrawer,
}: {
  label: string;
  icon: LucideIcon;
  isDrawer: boolean;
}) {
  const { pending } = useLinkStatus();

  return (
    <>
      <Icon
        className={cn(
          "shrink-0",
          isDrawer ? "h-5 w-5 opacity-90" : "h-5 w-5",
          pending && "opacity-50"
        )}
        aria-hidden
      />
      <span className={cn("truncate", pending && "opacity-60")}>{label}</span>
    </>
  );
}

export function PublicNavLinks({
  pathname,
  onNavigate,
  className,
  variant = "sidebar",
}: Props) {
  const isDrawer = variant === "drawer";
  const championshipSlug = usePortalChampionshipSlug();
  const navItems = championshipSlug
    ? buildChampionshipPublicNav(championshipSlug)
    : PUBLIC_MAIN_NAV;

  return (
    <nav
      className={cn(isDrawer ? "flex flex-col gap-1" : "space-y-0.5", className)}
      aria-label="Navegação principal"
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = championshipSlug
          ? isChampionshipPublicNavActive(pathname, href, championshipSlug)
          : isPublicNavActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center font-medium transition-colors active:scale-[0.99]",
              isDrawer
                ? cn(
                    "min-h-12 gap-3.5 rounded-xl px-4 py-3 text-[15px]",
                    active
                      ? "bg-selected text-white shadow-sm"
                      : "text-foreground/90 hover:bg-white/[0.06] active:bg-white/[0.08]"
                  )
                : cn(
                    "min-h-11 gap-3 rounded-lg px-3 py-2.5 text-sm",
                    active
                      ? "nav-active"
                      : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  )
            )}
          >
            <NavLinkLabel label={label} icon={Icon} isDrawer={isDrawer} />
          </Link>
        );
      })}
    </nav>
  );
}
