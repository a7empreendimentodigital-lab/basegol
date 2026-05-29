import { prisma } from "@/lib/prisma";
import type { HomeCategory } from "@/types/home";
import type { TopScorerRow } from "@/components/home/HomeTopScorersCard";
import type { StandingRowDisplay } from "@/types";
import { getStandingsForCategory, getTopScorersForCategory } from "@/services/statistics.service";

export type HomeCategoryCircle = {
  id: string;
  label: string;
  subtitle: string;
  championshipSlug: string;
  categoryId: string;
};

export async function getHomeCategoryCircles(): Promise<HomeCategoryCircle[]> {
  try {
    const categories = await prisma.category.findMany({
      where: {
        championship: { status: { in: ["ACTIVE", "REGISTRATION"] } },
      },
      include: { championship: true },
      orderBy: { name: "asc" },
      take: 12,
    });
    return categories.map((c) => ({
      id: c.id,
      label: c.name,
      subtitle: c.championship.season,
      championshipSlug: c.championship.slug,
      categoryId: c.id,
    }));
  } catch {
    return [];
  }
}

export async function getHomeCompetitionCategories(): Promise<HomeCategory[]> {
  const circles = await getHomeCategoryCircles();
  return circles.map((c) => ({
    id: c.id,
    label: c.label,
    slug: c.championshipSlug,
  }));
}

export async function getHomeSidebarData() {
  const categories = await getHomeCompetitionCategories();
  const standingsByCategory: Record<string, StandingRowDisplay[]> = {};
  const scorersByCategory: Record<string, TopScorerRow[]> = {};

  await Promise.all(
    categories.map(async (cat) => {
      const [standings, scorers] = await Promise.all([
        getStandingsForCategory(cat.id),
        getTopScorersForCategory(cat.id, 5),
      ]);
      standingsByCategory[cat.id] = standings;
      scorersByCategory[cat.id] = scorers.map((s) => ({
        name: s.name,
        club: s.club,
        goals: s.goals,
        photoUrl: s.photoUrl,
      }));
    })
  );

  return { categories, standingsByCategory, scorersByCategory };
}
