"use client";

import { SiteFooterInner } from "@/components/layout/SiteFooter";
import { resolveDeveloperLogoUrl } from "@/lib/site-developer";

type Props = {
  systemName?: string;
  className?: string;
};

export function SiteFooterClient({ systemName = "BASEGOL", className }: Props) {
  return (
    <SiteFooterInner
      systemName={systemName.trim() || "BASEGOL"}
      developerLogoUrl={resolveDeveloperLogoUrl()}
      className={className}
    />
  );
}
