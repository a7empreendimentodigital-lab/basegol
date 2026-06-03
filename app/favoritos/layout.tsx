import { SettingsPageLayout } from "@/components/layout/SettingsPageLayout";
import { PublicRightSidebarLayout } from "@/components/layout/PublicRightSidebarLayout";
import { getServerPortalChampionshipSlug } from "@/lib/portal-championship-context.server";

export default async function FavoritosLayout({ children }: { children: React.ReactNode }) {
  const championshipSlug = await getServerPortalChampionshipSlug();

  if (championshipSlug) {
    return (
      <PublicRightSidebarLayout championshipSlug={championshipSlug}>
        <SettingsPageLayout>{children}</SettingsPageLayout>
      </PublicRightSidebarLayout>
    );
  }

  return <SettingsPageLayout>{children}</SettingsPageLayout>;
}
