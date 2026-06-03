"use client";

import { normalizeImageSrc } from "@/lib/image-url";
import { buildPortalSocialLinks } from "@/lib/portal-brand";
import { PortalEntryFooter } from "@/components/portal/PortalEntryFooter";
import { PortalEntryHeader } from "@/components/portal/PortalEntryHeader";

type Props = {
  mobileLogoUrl: string | null;
  systemName: string;
  slogan: string;
  homeHeroBackgroundUrl: string | null;
  portalContactUrl: string | null;
  portalContactLabel: string | null;
  socialInstagramUrl: string | null;
  socialFacebookUrl: string | null;
  socialYoutubeUrl: string | null;
  children: React.ReactNode;
};

export function PortalInstitutionalShellClient({
  mobileLogoUrl,
  systemName,
  slogan,
  homeHeroBackgroundUrl,
  portalContactUrl,
  portalContactLabel,
  socialInstagramUrl,
  socialFacebookUrl,
  socialYoutubeUrl,
  children,
}: Props) {
  const bgSrc = normalizeImageSrc(homeHeroBackgroundUrl);
  const socialLinks = buildPortalSocialLinks({
    socialInstagramUrl,
    socialFacebookUrl,
    socialYoutubeUrl,
  });

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
        mobileLogoUrl={mobileLogoUrl}
        systemName={systemName}
        contactUrl={portalContactUrl}
        contactLabel={portalContactLabel}
      />

      <div className="relative z-10 flex flex-1 flex-col">{children}</div>

      <PortalEntryFooter
        systemName={systemName}
        slogan={slogan}
        socialLinks={socialLinks}
      />
    </div>
  );
}
