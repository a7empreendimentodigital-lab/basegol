import { Suspense } from "react";
import { HomeRightSidebarDesktop } from "@/components/home/HomeRightSidebarDesktop";
import { HomeRightSidebarMobile } from "@/components/home/HomeRightSidebarMobile";
import { getActiveBannersByPlacement } from "@/services/banner.service";

type Props = {
  children: React.ReactNode;
  /** Quando definido, a sidebar direita mostra só categorias deste campeonato. */
  championshipSlug?: string;
};

function DesktopSidebarSkeleton() {
  return (
    <div className="space-y-3 p-4 animate-pulse" aria-hidden>
      <div className="h-24 rounded-2xl bg-graphite-light/80" />
      <div className="h-48 rounded-2xl bg-graphite-light/60" />
    </div>
  );
}

export async function PublicRightSidebarLayout({ children, championshipSlug }: Props) {
  const rightBanners = await getActiveBannersByPlacement("SIDEBAR_RIGHT");
  const rightBanner = rightBanners[0] ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden xl:pr-[300px] 2xl:pr-[320px]">
          {children}
          <HomeRightSidebarMobile
            key={championshipSlug ?? "global"}
            rightBanner={rightBanner}
            championshipSlug={championshipSlug}
          />
        </div>

        <aside className="hidden border-l border-line bg-graphite/40 xl:fixed xl:right-0 xl:top-16 xl:z-30 xl:flex xl:h-[calc(100dvh-4rem)] xl:w-[300px] xl:flex-col xl:overflow-y-auto 2xl:w-[320px]">
          <div className="p-4">
            <Suspense fallback={<DesktopSidebarSkeleton />}>
              <HomeRightSidebarDesktop
                key={championshipSlug ?? "global"}
                rightBanner={rightBanner}
                championshipSlug={championshipSlug}
              />
            </Suspense>
          </div>
        </aside>
      </div>
    </div>
  );
}
