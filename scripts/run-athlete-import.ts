/**
 * Importa atletas a partir de CSV.
 *
 * Uso:
 *   npx tsx scripts/run-athlete-import.ts <arquivo.csv> [--dry-run]
 *
 * Requer DATABASE_URL no ambiente (.env).
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { runAthletesCsvImport } from "@/services/athlete-import/athlete-import.service";

async function main() {
  const filePath = process.argv[2];
  const dryRun = process.argv.includes("--dry-run");

  if (!filePath) {
    console.error("Uso: npx tsx scripts/run-athlete-import.ts <arquivo.csv> [--dry-run]");
    process.exit(1);
  }

  const abs = resolve(filePath);
  const buffer = readFileSync(abs);
  const result = await runAthletesCsvImport({ buffer, dryRun });

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
