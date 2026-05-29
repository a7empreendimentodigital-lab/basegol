import { HeroBannerCarousel } from "@/components/public/HeroBannerCarousel";
import { PublicRightSidebarLayout } from "@/components/layout/PublicRightSidebarLayout";
import { HomeCategoriesRow } from "@/components/home/HomeCategoriesRow";
import { LiveMatchesSection } from "@/components/matches/LiveMatchesSection";
import { TodayMatchesSection } from "@/components/matches/TodayMatchesList";
import { getLiveMatches, getTodayMatches } from "@/services/match.service";
import { HomeQuickLinks } from "@/components/home/HomeQuickLinks";
import { getPublicSiteConfig } from "@/lib/site-config";
import { getHomeCategoryCircles } from "@/services/home.service";
import { getHomeBanners } from "@/services/banner.service";

export default async function HomePage() {
  const [liveMatches, todayMatches, publicConfig, categoryCircles, homeBanners] =
    await Promise.all([
      getLiveMatches(),
      getTodayMatches(),
      getPublicSiteConfig(),
      getHomeCategoryCircles(),
      getHomeBanners(),
    ]);

  const heroTitle =
    publicConfig.texts.find((t) => t.key === "home.hero.title")?.value ??
    "O FUTURO DO FUTEBOL PAULISTA COMEÇA AQUI";

  return (
    <PublicRightSidebarLayout>
      <main className="min-w-0 flex-1 space-y-6 overflow-x-hidden p-4 md:p-5 lg:p-6">
        <HeroBannerCarousel
          slides={homeBanners.hero}
          fallbackTitle={heroTitle}
          fallbackSubtitle={publicConfig.brand?.slogan ?? undefined}
          fallbackBackgroundUrl={publicConfig.brand?.homeHeroBackgroundUrl ?? null}
        />

        <LiveMatchesSection matches={liveMatches} />

        <TodayMatchesSection matches={todayMatches} />

        <HomeCategoriesRow categories={categoryCircles} />

        <HomeQuickLinks />
      </main>
    </PublicRightSidebarLayout>
  );
}
