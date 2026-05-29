/**
 * Remove jogos duplicados da importação (mesma partida na mesma categoria).
 * Mantém o registro com fingerprint novo (inclui sub-11/sub-12) ou o mais antigo com eventos.
 *
 * Uso: npx tsx scripts/remove-duplicate-import-matches.ts
 *      npx tsx scripts/remove-duplicate-import-matches.ts --dry-run
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

type DupRow = {
  championshipId: string;
  categoryId: string;
  homeClubId: string;
  awayClubId: string;
  scheduledAt: Date;
  c: bigint;
};

function scoreMatch(m: {
  importFingerprint: string | null;
  createdAt: Date;
  _count: { events: number; lineups: number };
}): number {
  let score = 0;
  if (m.importFingerprint?.includes("|sub-")) score += 10;
  score += m._count.events * 5;
  score += m._count.lineups * 2;
  return score;
}

async function main() {
  const dups = await prisma.$queryRaw<DupRow[]>`
    SELECT m.championshipId, g.categoryId, m.homeClubId, m.awayClubId, m.scheduledAt, COUNT(*) as c
    FROM matches m
    JOIN \`groups\` g ON m.groupId = g.id
    WHERE m.homeClubId IS NOT NULL AND m.awayClubId IS NOT NULL
    GROUP BY m.championshipId, g.categoryId, m.homeClubId, m.awayClubId, m.scheduledAt
    HAVING c > 1
  `;

  console.log(dryRun ? "[DRY-RUN]" : "[EXECUTANDO]", `${dups.length} grupos de jogos duplicados`);

  let removed = 0;
  for (const row of dups) {
    const matches = await prisma.match.findMany({
      where: {
        championshipId: row.championshipId,
        homeClubId: row.homeClubId,
        awayClubId: row.awayClubId,
        scheduledAt: row.scheduledAt,
        group: { categoryId: row.categoryId },
      },
      include: {
        homeClub: { select: { name: true } },
        awayClub: { select: { name: true } },
        group: { include: { category: { select: { name: true } } } },
        _count: { select: { events: true, lineups: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    if (matches.length < 2) continue;

    const ranked = [...matches].sort(
      (a, b) => scoreMatch(b) - scoreMatch(a) || a.createdAt.getTime() - b.createdAt.getTime()
    );
    const keep = ranked[0];
    const toRemove = ranked.slice(1);

    for (const m of toRemove) {
      console.log(
        `Remover ${m.id} | ${m.group.category.name} | ${m.homeClub?.name} x ${m.awayClub?.name} | manter ${keep.id}`
      );
      if (!dryRun) {
        await prisma.match.delete({ where: { id: m.id } });
      }
      removed++;
    }
  }

  const after = await prisma.$queryRaw<{ cat: string; matches: bigint }[]>`
    SELECT c.name as cat, COUNT(m.id) as matches
    FROM matches m
    JOIN \`groups\` g ON m.groupId = g.id
    JOIN categories c ON g.categoryId = c.id
    GROUP BY c.id, c.name
  `;

  console.log("\nJogos removidos:", removed);
  console.log("Jogos por categoria após limpeza:", after);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
