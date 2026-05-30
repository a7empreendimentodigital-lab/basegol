import { Suspense } from "react";
import { HomeRightSidebarDesktop } from "@/components/home/HomeRightSidebarDesktop";
import { HomeRightSidebarMobile } from "@/components/home/HomeRightSidebarMobile";
import { getActiveBannersByPlacement } from "@/services/banner.service";

type Props = {
  children: React.ReactNode;
};

function DesktopSidebarSkeleton() {
  return (
    <div className="space-y-3 p-4 animate-pulse" aria-hidden>
      <div className="h-24 rounded-2xl bg-graphite-light/80" />
      <div className="h-48 rounded-2xl bg-graphite-light/60" />
    </div>
  );
}

export async function PublicRightSidebarLayout({ children }: Props) {
  const rightBanners = await getActiveBannersByPlacement("SIDEBAR_RIGHT");
  const rightBanner = rightBanners[0] ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
          {children}
          <HomeRightSidebarMobile rightBanner={rightBanner} />
        </div>

        <aside className="hidden shrink-0 flex-col overflow-y-auto border-l border-line bg-graphite/40 xl:flex xl:w-[300px] 2xl:w-[320px]">
          <div className="sticky top-0 p-4">
            <Suspense fallback={<DesktopSidebarSkeleton />}>
              <HomeRightSidebarDesktop rightBanner={rightBanner} />
            </Suspense>
          </div>
        </aside>
      </div>
    </div>
  );
}
