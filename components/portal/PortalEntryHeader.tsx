"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileBrandLogo } from "@/components/brand/MobileBrandLogo";
import { PORTAL_INSTITUTIONAL_NAV } from "@/lib/portal-routes";
import { cn } from "@/lib/utils";

type Props = {
  activePath: string;
  mobileLogoUrl?: string | null;
  systemName?: string;
};

export function PortalEntryHeader({
  activePath,
  mobileLogoUrl = null,
  systemName = "BASEGOL",
}: Props) {
  const pathname = usePathname() ?? "/";

  return (
    <header className="relative z-20 shrink-0 border-b border-white/5 bg-black">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:h-[4.25rem] sm:px-6 lg:px-8">
        <MobileBrandLogo
          href="/"
          src={mobileLogoUrl}
          systemName={systemName}
          className="shrink-0"
          imageClassName="h-10 sm:h-11"
        />

        <nav
          className="hidden items-center justify-end gap-6 sm:flex sm:gap-8 md:gap-10"
          aria-label="Institucional"
        >
          {PORTAL_INSTITUTIONAL_NAV.map((item) => {
            const active = activePath === item.href || pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative pb-1 text-sm font-medium uppercase tracking-wide transition-colors",
                  active
                    ? "text-[#22c55e]"
                    : "text-white hover:text-white/90"
                )}
              >
                {item.label}
                {active ? (
                  <span
                    className="absolute -bottom-px left-0 right-0 h-0.5 bg-[#22c55e]"
                    aria-hidden
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
