import { sortByGroupName } from "@/lib/sort-groups";
import { prisma } from "@/lib/prisma";
import { getStandingsForCategory, getStandingsForGroup } from "@/services/statistics.service";

export async function getChampionshipPublicDetail(slug: string) {
  const championship = await prisma.championship.findUnique({
    where: { slug },
    include: {
      categories: {
        orderBy: { name: "asc" },
        include: {
          groups: { orderBy: { name: "asc" } },
        },
      },
    },
  });
  if (!championship) return null;

  const categories = await Promise.all(
    championship.categories.map(async (cat) => {
      const general = await getStandingsForCategory(cat.id);
      const groups = await Promise.all(
        sortByGroupName(cat.groups).map(async (g) => ({
          id: g.id,
          name: g.name,
          standings: await getStandingsForGroup(g.id),
        }))
      );
      return {
        id: cat.id,
        name: cat.name,
        generalStandings: general,
        groups,
      };
    })
  );

  return {
    id: championship.id,
    name: championship.name,
    slug: championship.slug,
    season: championship.season,
    status: championship.status,
    logoUrl: championship.logoUrl,
    description: championship.description,
    categories,
  };
}

export type ChampionshipCategoryPublic = Awaited<
  ReturnType<typeof getChampionshipPublicDetail>
> extends infer T
  ? T extends { categories: infer C }
    ? C extends (infer U)[]
      ? U
      : never
    : never
  : never;
