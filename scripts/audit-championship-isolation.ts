/**
 * Auditoria read-only: vínculos entre campeonatos no banco.
 * Uso:
 *   npx tsx scripts/audit-championship-isolation.ts [slug-campeonato]
 *   DATABASE_URL="mysql://..." npx tsx scripts/audit-championship-isolation.ts
 */
import { PrismaClient } from "@prisma/client";

function maskDatabaseUrl(url: string) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.username ? "***:***@" : ""}${u.hostname}:${u.port || "3306"}${u.pathname}`;
  } catch {
    return "(url inválida)";
  }
}

async function main() {
  const targetSlug = process.argv[2];
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL não definida. Use a URL de produção (Railway/Vercel).");
    process.exit(1);
  }
  console.log(`Conectando em: ${maskDatabaseUrl(databaseUrl)}\n`);

  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: ["error"],
  });

  const championships = await prisma.championship.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      _count: {
        select: {
          categories: true,
          matches: true,
          sponsors: true,
          members: true,
        },
      },
    },
  });

  console.log("\n=== Campeonatos ===\n");
  for (const ch of championships) {
    console.log(
      `- ${ch.name} (${ch.slug}) [${ch.status}] | categorias=${ch._count.categories} jogos(direto)=${ch._count.matches} patrocinadores=${ch._count.sponsors} admins=${ch._count.members}`
    );
  }

  const mismatchedMatches = await prisma.$queryRaw<
    { id: string; championshipId: string | null; groupChampionshipId: string; groupName: string }[]
  >`
    SELECT m.id, m.championshipId, c.championshipId AS groupChampionshipId, g.name AS groupName
    FROM matches m
    INNER JOIN \`groups\` g ON g.id = m.groupId
    INNER JOIN categories c ON c.id = g.categoryId
    WHERE m.championshipId IS NOT NULL
      AND m.championshipId != c.championshipId
    LIMIT 50
  `;

  console.log("\n=== Jogos com championshipId divergente do grupo (máx. 50) ===\n");
  if (mismatchedMatches.length === 0) {
    console.log("(nenhum — OK)");
  } else {
    for (const row of mismatchedMatches) {
      console.log(
        `- match ${row.id}: match.championshipId=${row.championshipId} ≠ category.championshipId=${row.groupChampionshipId} (grupo ${row.groupName})`
      );
    }
  }

  const matchesNullChampionshipId = await prisma.match.count({
    where: { championshipId: null },
  });

  console.log(`\nJogos com championshipId NULL (escopo só via grupo): ${matchesNullChampionshipId}`);

  const categoriesByChamp = await prisma.category.groupBy({
    by: ["championshipId", "status"],
    _count: { _all: true },
  });

  console.log("\n=== Categorias por campeonato / status ===\n");
  for (const row of categoriesByChamp) {
    const ch = championships.find((c) => c.id === row.championshipId);
    console.log(`- ${ch?.name ?? row.championshipId} | ${row.status}: ${row._count._all}`);
  }

  const globalBanners = await prisma.banner.count({
    where: { isActive: true, placement: { in: ["SIDEBAR_LEFT", "SIDEBAR_RIGHT"] } },
  });
  const legacySponsors = await prisma.sponsor.count({ where: { isActive: true } });

  console.log("\n=== Conteúdo global (não vinculado a campeonato) ===\n");
  console.log(`- Banners ativos sidebar: ${globalBanners}`);
  console.log(`- Sponsors legado (tabela sponsors): ${legacySponsors}`);
  console.log(
    `- Notícias sem championshipId: ${await prisma.news.count({ where: { championshipId: null, publishedAt: { not: null } } })}`
  );

  if (targetSlug) {
    const target = championships.find((c) => c.slug === targetSlug);
    if (!target) {
      console.log(`\nCampeonato slug "${targetSlug}" não encontrado.\n`);
      return;
    }

    const viaGroup = await prisma.match.count({
      where: { group: { category: { championshipId: target.id } } },
    });
    const viaDirect = await prisma.match.count({
      where: { championshipId: target.id },
    });
    const teams = await prisma.team.count({
      where: { group: { category: { championshipId: target.id } } },
    });
    const sponsors = await prisma.championshipSponsor.count({
      where: { championshipId: target.id, isActive: true },
    });

    console.log(`\n=== Detalhe: ${target.name} (${target.slug}) ===\n`);
    console.log(`- Jogos (via grupo/categoria): ${viaGroup}`);
    console.log(`- Jogos (championshipId direto): ${viaDirect}`);
    console.log(`- Times em grupos: ${teams}`);
    console.log(`- Patrocinadores ativos: ${sponsors}`);

    const categories = await prisma.category.findMany({
      where: { championshipId: target.id },
      select: { id: true, name: true, slug: true, status: true, _count: { select: { groups: true } } },
    });
    console.log("\nCategorias deste campeonato:");
    for (const cat of categories) {
      console.log(`  - ${cat.name} (${cat.slug}) [${cat.status}] grupos=${cat._count.groups}`);
    }
    if (categories.length === 0) {
      console.log("  (nenhuma — portal público deve ficar vazio)");
    }
  }

  console.log("\nAuditoria concluída.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
