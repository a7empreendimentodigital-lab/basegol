/**
 * Remove dados gerados por importação de tabela (FPF) para recomeçar limpo.
 *
 * Mantém: campeonato, usuários, permissões, mídia, configurações.
 * Remove (no escopo do campeonato): jogos, times, grupos, fases/turnos/rodadas,
 * inscrições, histórico de importação e clubes (opcional).
 *
 * Uso:
 *   npx tsx scripts/reset-schedule-import-data.ts --list
 *   npx tsx scripts/reset-schedule-import-data.ts <championshipId> --dry-run
 *   npx tsx scripts/reset-schedule-import-data.ts <championshipId> --confirm
 *   npx tsx scripts/reset-schedule-import-data.ts <championshipId> --confirm --all-clubs
 *   npx tsx scripts/reset-schedule-import-data.ts <championshipId> --confirm --with-categories
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const listMode = args.includes("--list");
const dryRun = args.includes("--dry-run");
const confirm = args.includes("--confirm");
const allClubs = args.includes("--all-clubs");
const withCategories = args.includes("--with-categories");
const championshipId = args.find((a) => !a.startsWith("--"));

async function listChampionships() {
  const rows = await prisma.championship.findMany({
    select: { id: true, name: true, slug: true, _count: { select: { matches: true, categories: true } } },
    orderBy: { name: "asc" },
  });
  console.log("Campeonatos:\n");
  for (const c of rows) {
    console.log(`  ${c.id}`);
    console.log(`    ${c.name} (${c.slug}) — ${c._count.categories} categorias, ${c._count.matches} jogos\n`);
  }
}

async function countPlan(champId: string) {
  const categories = await prisma.category.findMany({
    where: { championshipId: champId },
    select: { id: true, name: true, slug: true },
  });
  const categoryIds = categories.map((c) => c.id);
  const groups = await prisma.group.findMany({
    where: { categoryId: { in: categoryIds } },
    select: { id: true },
  });
  const groupIds = groups.map((g) => g.id);

  const [
    matches,
    teams,
    standings,
    phases,
    rounds,
    imports,
    registrations,
    clubsTotal,
    clubsOrphan,
    athletes,
    venuesUnused,
  ] = await Promise.all([
    prisma.match.count({
      where: { OR: [{ championshipId: champId }, { groupId: { in: groupIds } }] },
    }),
    prisma.team.count({ where: { groupId: { in: groupIds } } }),
    prisma.standing.count({
      where: { OR: [{ categoryId: { in: categoryIds } }, { groupId: { in: groupIds } }] },
    }),
    prisma.competitionPhase.count({ where: { championshipId: champId } }),
    prisma.competitionRound.count({ where: { championshipId: champId } }),
    prisma.scheduleImport.count({ where: { championshipId: champId } }),
    prisma.registration.count({ where: { championshipId: champId } }),
    prisma.club.count(),
    prisma.club.count({ where: { teams: { none: {} } } }),
    allClubs
      ? prisma.athlete.count()
      : prisma.athlete.count({ where: { club: { teams: { none: {} } } } }),
    prisma.venue.count({ where: { matches: { none: {} } } }),
  ]);

  const clubsToDelete = allClubs ? clubsTotal : clubsOrphan;

  return {
    categories,
    categoryIds,
    groupIds,
    counts: {
      matches,
      teams,
      groups: groupIds.length,
      standings,
      phases,
      rounds,
      imports,
      registrations,
      categories: categories.length,
      clubsToDelete,
      athletes,
      venuesUnused,
    },
  };
}

async function executeReset(champId: string) {
  const { categoryIds, groupIds, counts } = await countPlan(champId);

  await prisma.$transaction(async (tx) => {
    const matchWhere = {
      OR: [{ championshipId: champId }, { groupId: { in: groupIds } }],
    };

    const matches = await tx.match.findMany({ where: matchWhere, select: { id: true } });
    const matchIds = matches.map((m) => m.id);

    if (matchIds.length > 0) {
      await tx.favorite.deleteMany({
        where: { type: "MATCH", entityId: { in: matchIds } },
      });
    }

    const deletedMatches = await tx.match.deleteMany({ where: matchWhere });

    await tx.standingRow.deleteMany({
      where: {
        standing: {
          OR: [{ categoryId: { in: categoryIds } }, { groupId: { in: groupIds } }],
        },
      },
    });
    await tx.standing.deleteMany({
      where: {
        OR: [{ categoryId: { in: categoryIds } }, { groupId: { in: groupIds } }],
      },
    });

    const deletedTeams = await tx.team.deleteMany({ where: { groupId: { in: groupIds } } });
    const deletedGroups = await tx.group.deleteMany({ where: { id: { in: groupIds } } });

    if (withCategories && categoryIds.length > 0) {
      await tx.category.deleteMany({ where: { id: { in: categoryIds } } });
    }

    await tx.competitionRound.deleteMany({ where: { championshipId: champId } });
    await tx.competitionTurn.deleteMany({
      where: { phase: { championshipId: champId } },
    });
    await tx.competitionPhase.deleteMany({ where: { championshipId: champId } });

    await tx.registration.deleteMany({ where: { championshipId: champId } });
    await tx.scheduleImport.deleteMany({ where: { championshipId: champId } });

    await tx.venue.deleteMany({ where: { matches: { none: {} } } });

    let deletedClubs = 0;
    if (allClubs) {
      const clubIds = (await tx.club.findMany({ select: { id: true } })).map((c) => c.id);
      if (clubIds.length > 0) {
        await tx.favorite.deleteMany({
          where: { type: "CLUB", entityId: { in: clubIds } },
        });
      }
      const r = await tx.club.deleteMany({});
      deletedClubs = r.count;
    } else {
      const orphanClubs = await tx.club.findMany({
        where: { teams: { none: {} } },
        select: { id: true },
      });
      const orphanIds = orphanClubs.map((c) => c.id);
      if (orphanIds.length > 0) {
        await tx.favorite.deleteMany({
          where: { type: "CLUB", entityId: { in: orphanIds } },
        });
        const r = await tx.club.deleteMany({ where: { id: { in: orphanIds } } });
        deletedClubs = r.count;
      }
    }

    console.log("Removido:", {
      matches: deletedMatches.count,
      teams: deletedTeams.count,
      groups: deletedGroups.count,
      categories: withCategories ? categoryIds.length : 0,
      clubs: deletedClubs,
      planned: counts,
    });
  });
}

async function main() {
  if (listMode) {
    await listChampionships();
    return;
  }

  if (!championshipId) {
    console.error(
      "Informe o ID do campeonato.\n\n" +
        "  npx tsx scripts/reset-schedule-import-data.ts --list\n" +
        "  npx tsx scripts/reset-schedule-import-data.ts <championshipId> --dry-run\n" +
        "  npx tsx scripts/reset-schedule-import-data.ts <championshipId> --confirm --all-clubs"
    );
    process.exit(1);
  }

  const championship = await prisma.championship.findUnique({
    where: { id: championshipId },
    select: { id: true, name: true },
  });
  if (!championship) {
    console.error("Campeonato não encontrado:", championshipId);
    process.exit(1);
  }

  const plan = await countPlan(championshipId);
  const prefix = dryRun ? "[dry-run] " : confirm ? "" : "[prévia] ";

  console.log(`${prefix}Reset — ${championship.name} (${championship.id})\n`);
  console.log("Categorias:", plan.categories.map((c) => c.name).join(", ") || "(nenhuma)");
  console.log("Será removido:", plan.counts);
  console.log(
    "\nOpções:",
    [
      allClubs ? "TODOS os clubes do banco" : "só clubes sem time (órfãos)",
      withCategories ? "apagar categorias também" : "manter categorias (Sub-11, Sub-12)",
    ].join(" · ")
  );

  if (!confirm && !dryRun) {
    console.log(
      "\nNada foi alterado. Para executar:\n" +
        `  npx tsx scripts/reset-schedule-import-data.ts ${championshipId} --confirm --all-clubs`
    );
    return;
  }

  if (dryRun) {
    console.log("\nDry-run: nenhuma alteração no banco.");
    return;
  }

  console.log("\nExecutando…");
  await executeReset(championshipId);
  console.log("\nPronto. Importe o PDF de participantes (Sub-11-1-2.pdf) com “Só clubes e grupos”.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
