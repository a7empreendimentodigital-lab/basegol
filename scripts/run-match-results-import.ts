/**
 * Importa resultados (placares) a partir de CSV e recalcula classificação.
 *
 * Uso:
 *   npx tsx scripts/run-match-results-import.ts <arquivo.csv> <championshipId> [Sub-11|Sub-12] [--dry-run]
 *
 * Requer DATABASE_URL no ambiente (.env).
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { runMatchResultsCsvImport } from "@/services/match-results-import/match-results-import.service";

async function main() {
  const filePath = process.argv[2];
  const championshipId = process.argv[3];
  const dryRun = process.argv.includes("--dry-run");
  const args = process.argv.slice(4).filter((a) => a !== "--dry-run");
  const categoryHint = args[0];

  if (!filePath || !championshipId) {
    console.error(
      "Uso: npx tsx scripts/run-match-results-import.ts <arquivo.csv> <championshipId> [Sub-11|Sub-12] [--dry-run]"
    );
    process.exit(1);
  }

  const abs = resolve(filePath);
  const buffer = readFileSync(abs);
  const result = await runMatchResultsCsvImport({
    buffer,
    championshipId,
    categoryHint,
    dryRun,
    recalculateStandings: !dryRun,
  });

  console.log(dryRun ? "=== PRÉVIA (dry-run) ===" : "=== IMPORTAÇÃO ===");
  console.log(JSON.stringify(result.summary, null, 2));
  if (result.preview.length > 0) {
    console.log("\nPrimeiras linhas:");
    console.table(result.preview.slice(0, 20));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
