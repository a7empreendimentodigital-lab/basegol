/**
 * Preenche homeClubId/awayClubId em jogos criados manualmente (sem importação).
 * Uso: npx tsx scripts/backfill-match-club-ids.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const matches = await prisma.match.findMany({
    where: {
      OR: [{ homeClubId: null }, { awayClubId: null }],
    },
    include: {
      homeTeam: { select: { clubId: true } },
      awayTeam: { select: { clubId: true } },
      group: { include: { category: { select: { name: true } } } },
    },
  });

  let updated = 0;
  for (const m of matches) {
    const homeClubId = m.homeClubId ?? m.homeTeam.clubId;
    const awayClubId = m.awayClubId ?? m.awayTeam.clubId;
    if (homeClubId === m.homeClubId && awayClubId === m.awayClubId) continue;

    await prisma.match.update({
      where: { id: m.id },
      data: { homeClubId, awayClubId },
    });
    console.log(`Atualizado ${m.id} (${m.group.category.name})`);
    updated++;
  }
  console.log(`Total: ${updated} jogos`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
