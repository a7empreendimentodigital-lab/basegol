import { prisma } from "@/lib/prisma";

export type SearchResult = {
  type: "club" | "championship" | "match";
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
  imageUrl: string | null;
};

export async function searchPublic(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const [clubs, championships, matches] = await Promise.all([
    prisma.club.findMany({
      where: {
        status: "APPROVED",
        OR: [
          { name: { contains: q } },
          { shortName: { contains: q } },
          { city: { contains: q } },
        ],
      },
      take: 8,
      select: { id: true, name: true, slug: true, city: true, crestUrl: true },
    }),
    prisma.championship.findMany({
      where: {
        status: { in: ["ACTIVE", "REGISTRATION"] },
        OR: [{ name: { contains: q } }, { season: { contains: q } }],
      },
      take: 6,
      select: { id: true, name: true, slug: true, season: true },
    }),
    prisma.match.findMany({
      where: {
        OR: [
          { homeTeam: { club: { name: { contains: q } } } },
          { awayTeam: { club: { name: { contains: q } } } },
          { venue: { contains: q } },
        ],
      },
      include: {
        homeTeam: { include: { club: true } },
        awayTeam: { include: { club: true } },
      },
      orderBy: { scheduledAt: "desc" },
      take: 8,
    }),
  ]);

  const results: SearchResult[] = [];

  for (const c of clubs) {
    results.push({
      type: "club",
      id: c.id,
      title: c.name,
      subtitle: c.city,
      href: `/favoritos?club=${c.slug}`,
      imageUrl: c.crestUrl,
    });
  }

  for (const ch of championships) {
    results.push({
      type: "championship",
      id: ch.id,
      title: ch.name,
      subtitle: `Temporada ${ch.season}`,
      href: `/campeonatos/${ch.slug}`,
      imageUrl: null,
    });
  }

  for (const m of matches) {
    results.push({
      type: "match",
      id: m.id,
      title: `${m.homeTeam.club.name} x ${m.awayTeam.club.name}`,
      subtitle: m.venue,
      href: `/jogos/${m.id}`,
      imageUrl: m.homeTeam.club.crestUrl,
    });
  }

  return results;
}
