/**
 * Lista clubes inscritos em mais de um grupo na mesma categoria.
 *
 * Uso:
 *   npx tsx scripts/audit-duplicate-group-teams.ts [categoryId opcional]
 */
import { prisma } from "@/lib/prisma";

async function main() {
  const categoryFilter = process.argv[2];

  const teams = await prisma.team.findMany({
    where: categoryFilter ? { group: { categoryId: categoryFilter } } : undefined,
    include: {
      club: { select: { id: true, name: true } },
      group: { select: { id: true, name: true, category: { select: { id: true, name: true } } } },
    },
    orderBy: [{ club: { name: "asc" } }, { group: { name: "asc" } }],
  });

  const byKey = new Map<string, typeof teams>();
  for (const t of teams) {
    const key = `${t.clubId}|${t.group.category.id}`;
    const arr = byKey.get(key) ?? [];
    arr.push(t);
    byKey.set(key, arr);
  }

  let count = 0;
  for (const arr of byKey.values()) {
    if (arr.length < 2) continue;
    count += 1;
    console.log(`\n${arr[0].club.name} — ${arr[0].group.category.name}`);
    for (const t of arr) {
      const matches = await prisma.match.count({
        where: {
          groupId: t.group.id,
          OR: [{ homeTeamId: t.id }, { awayTeamId: t.id }],
        },
      });
      console.log(`  ${t.group.name}  teamId=${t.id}  jogos=${matches}`);
    }
  }

  console.log(`\n---\nClubes em 2+ grupos (mesma categoria): ${count}`);
  if (count > 0) {
    console.log(
      "Corrija com: npx tsx scripts/fix-duplicate-group-teams-from-fpf.ts <pasta_ou_json_fpf>"
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
