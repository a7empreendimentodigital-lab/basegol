import { prisma } from "@/lib/prisma";
import { clubSigla } from "@/lib/club-display";
import { sortByGroupName } from "@/lib/sort-groups";
import { getFeaturedNews } from "@/services/news.service";
import { getLiveMatches, getTodayMatches } from "@/services/match.service";

export type PublicGroupTeam = {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  crestUrl: string | null;
};

export type PublicGroupItem = {
  id: string;
  name: string;
  teams: PublicGroupTeam[];
};

export type PublicCategoryGroups = {
  id: string;
  name: string;
  championshipName: string;
  championshipSlug: string;
  season: string;
  groups: PublicGroupItem[];
};

export async function listPublicGroupsByCategory(
  championshipId?: string
): Promise<PublicCategoryGroups[]> {
  try {
    const categories = await prisma.category.findMany({
      where: {
        status: "ACTIVE",
        ...(championshipId
          ? { championshipId }
          : { championship: { status: { in: ["ACTIVE", "REGISTRATION"] } } }),
      },
      include: {
        championship: true,
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
      orderBy: [{ championship: { name: "asc" } }, { name: "asc" }],
    });

    return categories
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        championshipName: cat.championship.name,
        championshipSlug: cat.championship.slug,
        season: cat.championship.season,
        groups: sortByGroupName(cat.groups).map((g) => ({
          id: g.id,
          name: g.name,
          teams: g.teams
            .filter(
              (t) => t.club.status !== "REJECTED" && t.club.status !== "SUSPENDED"
            )
            .map((t) => ({
              id: t.club.id,
              name: t.club.name,
              displayName: clubSigla(t.club.shortName, t.club.name),
              slug: t.club.slug,
              crestUrl: t.club.crestUrl,
            }))
            .sort((a, b) => a.displayName.localeCompare(b.displayName, "pt-BR")),
        })),
      }))
      .filter((c) => c.groups.length > 0);
  } catch {
    return [];
  }
}

export async function listPublicClubs() {
  try {
    const clubs = await prisma.club.findMany({
      where: { status: "APPROVED" },
      include: { _count: { select: { athletes: true } } },
      orderBy: { name: "asc" },
    });
    return clubs.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      city: c.city,
      crestUrl: c.crestUrl,
      bannerUrl: c.bannerUrl,
      status: c.status,
      athleteCount: c._count.athletes,
    }));
  } catch {
    return [];
  }
}

export async function listPublicAthletes() {
  try {
    const athletes = await prisma.athlete.findMany({
      include: { club: true },
      orderBy: { lastName: "asc" },
      take: 100,
    });
    return athletes.map((a) => ({
      id: a.id,
      slug: a.slug,
      name: `${a.firstName} ${a.lastName}`,
      position: a.position,
      clubName: a.club.name,
      clubSlug: a.club.slug,
      birthDate: a.birthDate,
      status: a.status,
      photoUrl: a.photoUrl,
      shirtNumber: a.shirtNumber,
    }));
  } catch {
    return [];
  }
}

export async function listPublicChampionships() {
  try {
    const items = await prisma.championship.findMany({
      where: { status: { in: ["ACTIVE", "REGISTRATION"] } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return items;
  } catch {
    return [];
  }
}

export async function getPublicChampionshipBySlug(slug: string) {
  try {
    return await prisma.championship.findUnique({ where: { slug } });
  } catch {
    return null;
  }
}

export async function getPublicClubBySlug(slug: string) {
  try {
    return await prisma.club.findUnique({
      where: { slug, status: "APPROVED" },
      include: {
        _count: { select: { athletes: true } },
        athletes: {
          where: { status: "ACTIVE" },
          orderBy: [{ category: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
          take: 200,
        },
        teams: {
          include: {
            group: {
              include: {
                category: {
                  include: { championship: true },
                },
              },
            },
          },
        },
      },
    });
  } catch {
    return null;
  }
}

export async function getPublicAthleteBySlug(slug: string) {
  try {
    return await prisma.athlete.findUnique({
      where: { slug },
      include: { club: true },
    });
  } catch {
    return null;
  }
}

export async function listPublicMatches(
  status?: string | null,
  championshipSlug?: string | null
) {
  if (championshipSlug) {
    const { getChampionshipPortalBase } = await import(
      "@/services/championship-portal.service"
    );
    const {
      getLiveMatchesForChampionship,
      getTodayMatchesForChampionship,
    } = await import("@/services/match.service");
    const championship = await getChampionshipPortalBase(championshipSlug);
    if (!championship) return [];
    if (status === "LIVE") {
      return getLiveMatchesForChampionship(championship.id);
    }
    return getTodayMatchesForChampionship(championship.id);
  }
  if (status === "LIVE") return getLiveMatches();
  return getTodayMatches();
}

export async function listPublicNews() {
  return getFeaturedNews();
}
