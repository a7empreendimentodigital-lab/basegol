/**
 * Audita duplicatas após importação PDF.
 * Uso: npx tsx scripts/audit-import-duplicates.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const matchTotal = await prisma.match.count();
  const withFp = await prisma.match.count({
    where: { NOT: { importFingerprint: null } },
  });

  const dupFp = await prisma.$queryRaw<
    { importFingerprint: string; c: bigint }[]
  >`
    SELECT importFingerprint, COUNT(*) as c FROM matches
    WHERE importFingerprint IS NOT NULL
    GROUP BY importFingerprint HAVING c > 1
  `;

  const dupClubs = await prisma.$queryRaw<
    { normalizedName: string; c: bigint }[]
  >`
    SELECT normalizedName, COUNT(*) as c FROM clubs
    GROUP BY normalizedName HAVING c > 1
  `;

  const dupLogical = await prisma.$queryRaw<
    { championshipId: string; homeClubId: string; awayClubId: string; scheduledAt: Date; c: bigint }[]
  >`
    SELECT championshipId, homeClubId, awayClubId, scheduledAt, COUNT(*) as c
    FROM matches
    WHERE homeClubId IS NOT NULL AND awayClubId IS NOT NULL
    GROUP BY championshipId, homeClubId, awayClubId, scheduledAt
    HAVING c > 1
  `;

  const matchesByCat = await prisma.$queryRaw<
    { cat: string; matches: bigint }[]
  >`
    SELECT c.name as cat, COUNT(m.id) as matches
    FROM matches m
    JOIN \`groups\` g ON m.groupId = g.id
    JOIN categories c ON g.categoryId = c.id
    GROUP BY c.id, c.name
  `;

  const dupMatchNumber = await prisma.$queryRaw<
    { cat: string; matchNumber: number; c: bigint }[]
  >`
    SELECT c.name as cat, m.matchNumber, COUNT(*) as c
    FROM matches m
    JOIN \`groups\` g ON m.groupId = g.id
    JOIN categories c ON g.categoryId = c.id
    WHERE m.matchNumber IS NOT NULL
    GROUP BY c.id, c.name, m.matchNumber
    HAVING c > 1
    LIMIT 15
  `;

  const imports = await prisma.scheduleImport.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
    select: { fileName: true, status: true, summary: true, createdAt: true },
  });

  console.log("=== RESUMO ===");
  console.log({ matchTotal, withFingerprint: withFp });
  console.log("Jogos por categoria:", matchesByCat);
  console.log("Duplicatas fingerprint:", dupFp.length);
  console.log("Duplicatas lógicas (mesmo jogo):", dupLogical.length);
  console.log("Clubes nome duplicado:", dupClubs.length);
  console.log("Nº jogo repetido na categoria:", dupMatchNumber.length);

  if (dupLogical.length > 0) {
    console.log("\n=== AMOSTRA JOGOS DUPLICADOS ===");
    for (const row of dupLogical.slice(0, 10)) {
      const matches = await prisma.match.findMany({
        where: {
          championshipId: row.championshipId,
          homeClubId: row.homeClubId,
          awayClubId: row.awayClubId,
          scheduledAt: row.scheduledAt,
        },
        include: {
          homeClub: { select: { name: true } },
          awayClub: { select: { name: true } },
          group: { include: { category: { select: { name: true } } } },
        },
      });
      console.log({
        count: row.c,
        at: row.scheduledAt,
        home: matches[0]?.homeClub?.name,
        away: matches[0]?.awayClub?.name,
        ids: matches.map((m) => ({
          id: m.id,
          cat: m.group.category.name,
          fp: m.importFingerprint,
        })),
      });
    }
  }

  console.log("\n=== IMPORTAÇÕES RECENTES ===");
  for (const i of imports) {
    const s = i.summary as Record<string, unknown> | null;
    console.log({
      file: i.fileName,
      at: i.createdAt,
      imported: s?.matchesImported,
      skipped: s?.matchesSkippedDuplicate,
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
