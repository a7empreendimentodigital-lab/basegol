/**
 * Importa placares de uma rodada a partir do PDF da FPF.
 *
 * Uso:
 *   npx tsx scripts/run-round-results-pdf-import.ts <pdf> <championshipId> [--dry-run]
 */
import { readFileSync } from "fs";
import { runRoundResultsPdfImport } from "@/services/match-results-import/round-results-pdf-import.service";

async function main() {
  const pdfPath = process.argv[2];
  const championshipId = process.argv[3];
  const dryRun = process.argv.includes("--dry-run");

  if (!pdfPath || !championshipId) {
    console.error(
      "Uso: npx tsx scripts/run-round-results-pdf-import.ts <pdf> <championshipId> [--dry-run]"
    );
    process.exit(1);
  }

  const buffer = readFileSync(pdfPath);
  const result = await runRoundResultsPdfImport({
    buffer,
    championshipId,
    fileName: pdfPath.split("/").pop(),
    dryRun,
  });

  console.log(JSON.stringify(result.summary, null, 2));
  if (result.summary.errors > 0) {
    console.log("\nErros (amostra):");
    for (const row of result.preview.filter((r) => r.action === "error").slice(0, 15)) {
      console.log(`  #${row.matchNumber} ${row.homeClub} x ${row.awayClub}: ${row.message}`);
    }
  }
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
