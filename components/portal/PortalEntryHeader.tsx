"use client";

import Link from "next/link";
import { MobileBrandLogo } from "@/components/brand/MobileBrandLogo";
import { isExternalPortalHref, portalContactHref } from "@/lib/portal-brand";
import { cn } from "@/lib/utils";

type Props = {
  mobileLogoUrl?: string | null;
  systemName?: string;
  contactUrl?: string | null;
  contactLabel?: string | null;
};

export function PortalEntryHeader({
  mobileLogoUrl = null,
  systemName = "BASEGOL",
  contactUrl = null,
  contactLabel = "Contato",
}: Props) {
  const href = portalContactHref(contactUrl);
  const label = contactLabel?.trim() || "Contato";
  const external = isExternalPortalHref(href);

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

        <Link
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-lg border-0 bg-[#22c55e] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow-none transition-colors hover:bg-[#16a34a]"
          )}
        >
          {label}
        </Link>
      </div>
    </header>
  );
}
