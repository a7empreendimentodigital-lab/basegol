/**
 * Apaga somente jogos (mantém grupos, times e clubes).
 *
 * Uso:
 *   npx tsx scripts/purge-matches.ts --dry-run
 *   npx tsx scripts/purge-matches.ts --confirm
 *   npx tsx scripts/purge-matches.ts --confirm --championship <id>
 */
import { purgeMatchesOnly } from "@/services/match-purge.service";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const confirm = process.argv.includes("--confirm");
  const champIdx = process.argv.indexOf("--championship");
  const championshipId = champIdx >= 0 ? process.argv[champIdx + 1] : undefined;

  if (!dryRun && !confirm) {
    console.error("Use --dry-run para simular ou --confirm para apagar.");
    process.exit(1);
  }

  const result = await purgeMatchesOnly({ championshipId, dryRun });
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
