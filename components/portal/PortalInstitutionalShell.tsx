import { getBrandConfig } from "@/lib/site-config";
import { PortalInstitutionalShellClient } from "@/components/portal/PortalInstitutionalShellClient";

type Props = {
  children: React.ReactNode;
};

export async function PortalInstitutionalShell({ children }: Props) {
  const brand = await getBrandConfig();

  return (
    <PortalInstitutionalShellClient
      mobileLogoUrl={brand?.mobileLogoUrl ?? brand?.logoUrl ?? null}
      systemName={brand?.systemName?.trim() || "BASEGOL"}
      slogan={brand?.slogan?.trim() || "O futuro do futebol de base."}
      homeHeroBackgroundUrl={brand?.homeHeroBackgroundUrl ?? null}
      portalContactUrl={brand?.portalContactUrl ?? null}
      portalContactLabel={brand?.portalContactLabel ?? "Contato"}
      socialInstagramUrl={brand?.socialInstagramUrl ?? null}
      socialFacebookUrl={brand?.socialFacebookUrl ?? null}
      socialYoutubeUrl={brand?.socialYoutubeUrl ?? null}
    >
      {children}
    </PortalInstitutionalShellClient>
  );
}
