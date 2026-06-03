import { HomeRightSidebar } from "@/components/home/HomeRightSidebar";
import { championshipPublicBase } from "@/lib/championship-public-nav";
import {
  getHomeSidebarData,
  getHomeSidebarDataForChampionship,
} from "@/services/home.service";
import { getChampionshipPortalBase } from "@/services/championship-portal.service";
import type { PublicBannerDto } from "@/services/banner.service";

type Props = {
  rightBanner?: PublicBannerDto | null;
  championshipSlug?: string;
};

export async function HomeRightSidebarDesktop({ rightBanner, championshipSlug }: Props) {
  const championship = championshipSlug
    ? await getChampionshipPortalBase(championshipSlug)
    : null;

  const sidebarData = championship
    ? await getHomeSidebarDataForChampionship(championship.id, 4)
    : await getHomeSidebarData(4);

  const tableHref = championshipSlug
    ? `${championshipPublicBase(championshipSlug)}/classificacao`
    : "/tabela";

  return (
    <HomeRightSidebar
      categories={sidebarData.categories}
      standingsByCategory={sidebarData.standingsByCategory}
      scorersByCategory={sidebarData.scorersByCategory}
      rightBanner={rightBanner}
      championshipSlug={championshipSlug}
      competitionsLink={championshipSlug ? "/" : "/campeonatos"}
      tableHref={tableHref}
    />
  );
}
