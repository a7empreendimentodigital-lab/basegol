"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { PUBLIC_MAIN_NAV, isPublicNavActive } from "@/lib/public-nav";

type Props = {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
};

export function PublicNavLinks({ pathname, onNavigate, className }: Props) {
  return (
    <nav className={cn("space-y-0.5", className)} aria-label="Navegação principal">
      {PUBLIC_MAIN_NAV.map(({ href, label, icon: Icon }) => {
        const active = isPublicNavActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "nav-active"
                : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
