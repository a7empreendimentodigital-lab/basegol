import { TablesPageView } from "@/components/tabelas/TablesPageView";
import { PublicRightSidebarLayout } from "@/components/layout/PublicRightSidebarLayout";
import { PublicPageBanner } from "@/components/layout/PublicPageBanner";
import { getPublicTablesPageData } from "@/services/tables-public.service";

export const metadata = { title: "Tabelas" };

export default async function TabelaPage() {
  const categories = await getPublicTablesPageData();

  return (
    <PublicRightSidebarLayout>
      <PublicPageBanner title="Tabelas" />

      <main className="w-full px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <TablesPageView categories={categories} />
      </main>
    </PublicRightSidebarLayout>
  );
}
