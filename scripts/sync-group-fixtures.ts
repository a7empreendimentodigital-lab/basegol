/**
 * Sincroniza grupos (lista FPF) e importa/atualiza jogos do fixtures.csv.
 *
 * Uso:
 *   npx tsx scripts/sync-group-fixtures.ts
 *   npx tsx scripts/sync-group-fixtures.ts --dry-run
 *   npx tsx scripts/sync-group-fixtures.ts --category Sub-11
 */
import { syncFixturesFromFpfPack } from "@/services/group-fixtures-sync.service";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const categoryIdx = process.argv.indexOf("--category");
  const category =
    categoryIdx >= 0 ? process.argv[categoryIdx + 1] : undefined;
  const noRoster = process.argv.includes("--no-roster");

  const result = await syncFixturesFromFpfPack({
    dryRun,
    categoryFilter: category ?? null,
    syncRosterFirst: process.argv.includes("--with-roster"),
  });

  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$disconnect();
  });
