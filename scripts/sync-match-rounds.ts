/**
 * Corrige o campo rodada de todos os jogos conforme fixtures.csv da FPF.
 *
 * Uso: npx tsx scripts/sync-match-rounds.ts [--dry-run] [--category Sub-11]
 */
import { backfillMatchRoundsFromFpfPack } from "@/services/match-round-backfill.service";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const idx = process.argv.indexOf("--category");
  const category = idx >= 0 ? process.argv[idx + 1] : undefined;

  const result = await backfillMatchRoundsFromFpfPack({
    dryRun,
    categoryFilter: category ?? null,
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
