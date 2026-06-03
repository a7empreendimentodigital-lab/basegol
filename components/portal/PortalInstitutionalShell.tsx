import { getBrandConfig } from "@/lib/site-config";
import { PortalInstitutionalShellClient } from "@/components/portal/PortalInstitutionalShellClient";

type Props = {
  activePath: string;
  children: React.ReactNode;
};

export async function PortalInstitutionalShell({ activePath, children }: Props) {
  const brand = await getBrandConfig();

  return (
    <PortalInstitutionalShellClient
      activePath={activePath}
      mobileLogoUrl={brand?.mobileLogoUrl ?? brand?.logoUrl ?? null}
      systemName={brand?.systemName?.trim() || "BASEGOL"}
      slogan={brand?.slogan?.trim() || "O futuro do futebol de base."}
      homeHeroBackgroundUrl={brand?.homeHeroBackgroundUrl ?? null}
    >
      {children}
    </PortalInstitutionalShellClient>
  );
}
