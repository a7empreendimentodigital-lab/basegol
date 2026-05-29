import { prisma } from "@/lib/prisma";
import { getStandingsForCategory, getStandingsForGroup } from "@/services/statistics.service";
import type { StandingRowDisplay } from "@/types";

export type TablesGroupPublic = {
  id: string;
  name: string;
  standings: StandingRowDisplay[];
};

export type TablesCategoryPublic = {
  id: string;
  name: string;
  championshipName: string;
  championshipSlug: string;
  season: string;
  generalStandings: StandingRowDisplay[];
  groups: TablesGroupPublic[];
};

export async function getPublicTablesPageData(): Promise<TablesCategoryPublic[]> {
  try {
    const categories = await prisma.category.findMany({
      where: {
        championship: { status: { in: ["ACTIVE", "REGISTRATION"] } },
      },
      include: {
        championship: true,
        groups: { orderBy: { name: "asc" } },
      },
      orderBy: [{ championship: { name: "asc" } }, { name: "asc" }],
    });

    return Promise.all(
      categories.map(async (cat) => {
        const generalStandings = await getStandingsForCategory(cat.id);
        const groups = await Promise.all(
          cat.groups.map(async (g) => ({
            id: g.id,
            name: g.name,
            standings: await getStandingsForGroup(g.id),
          }))
        );
        return {
          id: cat.id,
          name: cat.name,
          championshipName: cat.championship.name,
          championshipSlug: cat.championship.slug,
          season: cat.championship.season,
          generalStandings,
          groups,
        };
      })
    );
  } catch {
    return [];
  }
}
