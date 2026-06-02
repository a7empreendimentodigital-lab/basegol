import type { Prisma } from "@prisma/client";
import { clubSigla } from "@/lib/club-display";
import { sortByGroupName } from "@/lib/sort-groups";
import { prisma } from "@/lib/prisma";
import { getChampionshipPublicDetail } from "@/services/championship-public.service";
import {
  getLiveMatchesForChampionship,
  getTodayMatchesForChampionship,
  getUpcomingMatchesForChampionship,
} from "@/services/match.service";
import { getTopScorersForCategory } from "@/services/statistics.service";
import { getFeaturedNews } from "@/services/news.service";

export function championshipMatchWhere(championshipId: string): Prisma.MatchWhereInput {
  return {
    OR: [{ championshipId }, { group: { category: { championshipId } } }],
  };
}

export async function listPortalChampionships() {
  try {
    return await prisma.championship.findMany({
      where: { status: { in: ["ACTIVE", "REGISTRATION"] } },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        season: true,
        status: true,
        logoUrl: true,
        bannerUrl: true,
        description: true,
        _count: { select: { categories: true } },
      },
    });
  } catch {
    return [];
  }
}

export async function getChampionshipPortalBase(slug: string) {
  const championship = await prisma.championship.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      season: true,
      status: true,
      logoUrl: true,
      bannerUrl: true,
      description: true,
    },
  });
  return championship;
}

export async function getChampionshipCategoriesForPortal(championshipId: string) {
  try {
    const categories = await prisma.category.findMany({
      where: { championshipId, status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        ageGroup: true,
        _count: { select: { groups: true } },
      },
    });
    return categories;
  } catch {
    return [];
  }
}

export async function getCategoryPortalDetail(championshipSlug: string, categorySlug: string) {
  const category = await prisma.category.findFirst({
    where: {
      slug: categorySlug,
      championship: { slug: championshipSlug },
      status: "ACTIVE",
    },
    include: {
      championship: {
        select: { id: true, name: true, slug: true, logoUrl: true, bannerUrl: true, season: true },
      },
      groups: {
        where: { status: "ACTIVE" },
        include: {
          teams: {
            include: {
              club: {
                select: {
                  id: true,
                  name: true,
                  shortName: true,
                  slug: true,
                  crestUrl: true,
                  status: true,
                },
              },
            },
          },
        },
      },
    },
  });
  if (!category) return null;

  const championshipId = category.championship.id;
  const [liveMatches, todayMatches, upcomingMatches, scorers, news] = await Promise.all([
    getLiveMatchesForChampionship(championshipId, category.id),
    getTodayMatchesForChampionship(championshipId, category.id),
    getUpcomingMatchesForChampionship(championshipId, category.id, 12),
    getTopScorersForCategory(category.id, 10),
    prisma.news.findMany({
      where: {
        publishedAt: { not: null },
        OR: [{ championshipId }, { championshipId: null }],
      },
      orderBy: { publishedAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        imageUrl: true,
        publishedAt: true,
      },
    }),
  ]);

  const detail = await getChampionshipPublicDetail(championshipSlug);
  const catStandings =
    detail?.categories.find((c) => c.id === category.id) ?? null;

  const clubs = sortByGroupName(category.groups)
    .flatMap((g) =>
      g.teams
        .filter((t) => t.club.status !== "REJECTED" && t.club.status !== "SUSPENDED")
        .map((t) => ({
          id: t.club.id,
          slug: t.club.slug,
          name: t.club.name,
          displayName: clubSigla(t.club.shortName, t.club.name),
          crestUrl: t.club.crestUrl,
          groupName: g.name,
        }))
    )
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "pt-BR"));

  const uniqueClubs = [...new Map(clubs.map((c) => [c.id, c])).values()];

  return {
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      imageUrl: category.imageUrl,
      ageGroup: category.ageGroup,
    },
    championship: category.championship,
    liveMatches,
    todayMatches,
    upcomingMatches,
    scorers,
    news,
    clubs: uniqueClubs,
    generalStandings: catStandings?.generalStandings ?? [],
    groups: catStandings?.groups ?? [],
  };
}

export async function getChampionshipClubsForPortal(championshipId: string) {
  try {
    const teams = await prisma.team.findMany({
      where: {
        group: { category: { championshipId, status: "ACTIVE" } },
        club: { status: { notIn: ["REJECTED", "SUSPENDED"] } },
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            shortName: true,
            slug: true,
            crestUrl: true,
            city: true,
          },
        },
        group: {
          select: {
            name: true,
            category: { select: { name: true } },
          },
        },
      },
    });

    const map = new Map<
      string,
      {
        id: string;
        slug: string;
        name: string;
        displayName: string;
        crestUrl: string | null;
        city: string | null;
        categories: string[];
      }
    >();

    for (const t of teams) {
      const existing = map.get(t.club.id);
      const catName = t.group.category.name;
      if (existing) {
        if (!existing.categories.includes(catName)) {
          existing.categories.push(catName);
        }
      } else {
        map.set(t.club.id, {
          id: t.club.id,
          slug: t.club.slug,
          name: t.club.name,
          displayName: clubSigla(t.club.shortName, t.club.name),
          crestUrl: t.club.crestUrl,
          city: t.club.city,
          categories: [catName],
        });
      }
    }

    return [...map.values()].sort((a, b) =>
      a.displayName.localeCompare(b.displayName, "pt-BR")
    );
  } catch {
    return [];
  }
}

export async function getChampionshipNewsForPortal(championshipId: string) {
  try {
    return await prisma.news.findMany({
      where: {
        publishedAt: { not: null },
        OR: [{ championshipId }, { championshipId: null }],
      },
      orderBy: { publishedAt: "desc" },
      take: 24,
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        imageUrl: true,
        publishedAt: true,
      },
    });
  } catch {
    return [];
  }
}

export async function getChampionshipStandingsForPortal(slug: string) {
  const detail = await getChampionshipPublicDetail(slug);
  if (!detail) return null;
  return detail;
}

/** Busca campeonatos por nome (portal inicial). */
export async function searchPortalChampionships(q: string) {
  const items = await listPortalChampionships();
  if (!q.trim()) return items;
  const term = q.trim().toLowerCase();
  return items.filter(
    (c) =>
      c.name.toLowerCase().includes(term) ||
      c.season.toLowerCase().includes(term) ||
      c.slug.toLowerCase().includes(term)
  );
}

export { getFeaturedNews };
