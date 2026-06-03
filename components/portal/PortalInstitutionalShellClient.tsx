"use client";

import { normalizeImageSrc } from "@/lib/image-url";
import { PortalEntryFooter } from "@/components/portal/PortalEntryFooter";
import { PortalEntryHeader } from "@/components/portal/PortalEntryHeader";

type Props = {
  activePath: string;
  mobileLogoUrl: string | null;
  systemName: string;
  slogan: string;
  homeHeroBackgroundUrl: string | null;
  children: React.ReactNode;
};

export function PortalInstitutionalShellClient({
  activePath,
  mobileLogoUrl,
  systemName,
  slogan,
  homeHeroBackgroundUrl,
  children,
}: Props) {
  const bgSrc = normalizeImageSrc(homeHeroBackgroundUrl);

  return (
    <div className="relative flex min-h-screen flex-col bg-black text-foreground">
      {bgSrc ? (
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgSrc})` }}
          aria-hidden
        />
      ) : null}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/75 via-black/85 to-black/95"
        aria-hidden
      />

      <PortalEntryHeader
        activePath={activePath}
        mobileLogoUrl={mobileLogoUrl}
        systemName={systemName}
      />

      <div className="relative z-10 flex flex-1 flex-col">{children}</div>

      <PortalEntryFooter
        mobileLogoUrl={mobileLogoUrl}
        systemName={systemName}
        slogan={slogan}
      />
    </div>
  );
}
