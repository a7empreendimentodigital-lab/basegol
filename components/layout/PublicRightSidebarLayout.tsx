import { HomeRightSidebar } from "@/components/home/HomeRightSidebar";
import { getActiveBannersByPlacement } from "@/services/banner.service";
import { getHomeSidebarData } from "@/services/home.service";

type Props = {
  children: React.ReactNode;
};

export async function PublicRightSidebarLayout({ children }: Props) {
  const [sidebarData, rightBanners] = await Promise.all([
    getHomeSidebarData(),
    getActiveBannersByPlacement("SIDEBAR_RIGHT"),
  ]);

  const sidebarProps = {
    categories: sidebarData.categories,
    standingsByCategory: sidebarData.standingsByCategory,
    scorersByCategory: sidebarData.scorersByCategory,
    rightBanner: rightBanners[0] ?? null,
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
          {children}
          <div className="border-t border-line px-3 py-6 sm:px-5 lg:px-8 xl:hidden">
            <HomeRightSidebar {...sidebarProps} />
          </div>
        </div>

        <aside className="hidden shrink-0 flex-col overflow-y-auto border-l border-line bg-graphite/40 xl:flex xl:w-[300px] 2xl:w-[320px]">
          <div className="sticky top-0 p-4">
            <HomeRightSidebar {...sidebarProps} />
          </div>
        </aside>
      </div>
    </div>
  );
}
