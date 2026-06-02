import { Suspense } from "react";
import { ClubesRightSidebar } from "@/components/clubes/ClubesRightSidebar";
import { getPublicGroupsByCategory } from "@/lib/public-groups-cache";
import { getActiveBannersByPlacement } from "@/services/banner.service";

type Props = {
  children: React.ReactNode;
};

function SidebarSkeleton() {
  return (
    <div className="space-y-3 p-4 animate-pulse" aria-hidden>
      <div className="h-24 rounded-2xl bg-graphite-light/80" />
      <div className="h-48 rounded-2xl bg-graphite-light/60" />
    </div>
  );
}

/** Layout de /clubes: sidebar mostra os mesmos grupos do conteúdo central. */
export async function ClubesLayoutShell({ children }: Props) {
  const [groupsData, rightBanners] = await Promise.all([
    getPublicGroupsByCategory(),
    getActiveBannersByPlacement("SIDEBAR_RIGHT"),
  ]);
  const rightBanner = rightBanners[0] ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden xl:pr-[300px] 2xl:pr-[320px]">
          {children}
          <div className="xl:hidden border-t border-line">
            <div className="px-4 py-4 sm:px-5">
              <ClubesRightSidebar categories={groupsData} rightBanner={rightBanner} />
            </div>
          </div>
        </div>

        <aside className="hidden border-l border-line bg-graphite/40 xl:fixed xl:right-0 xl:top-16 xl:z-30 xl:flex xl:h-[calc(100dvh-4rem)] xl:w-[300px] xl:flex-col xl:overflow-y-auto 2xl:w-[320px]">
          <div className="p-4">
            <Suspense fallback={<SidebarSkeleton />}>
              <ClubesRightSidebar categories={groupsData} rightBanner={rightBanner} />
            </Suspense>
          </div>
        </aside>
      </div>
    </div>
  );
}
