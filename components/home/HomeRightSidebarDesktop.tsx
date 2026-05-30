import { HomeRightSidebar } from "@/components/home/HomeRightSidebar";
import { getHomeSidebarData } from "@/services/home.service";
import type { PublicBannerDto } from "@/services/banner.service";

type Props = {
  rightBanner?: PublicBannerDto | null;
};

export async function HomeRightSidebarDesktop({ rightBanner }: Props) {
  const sidebarData = await getHomeSidebarData(4);

  return (
    <HomeRightSidebar
      categories={sidebarData.categories}
      standingsByCategory={sidebarData.standingsByCategory}
      scorersByCategory={sidebarData.scorersByCategory}
      rightBanner={rightBanner}
    />
  );
}
