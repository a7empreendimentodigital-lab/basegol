/**
 * Importação completa de teste (requer campeonato no banco).
 * Uso: npx tsx scripts/run-schedule-import.ts <pdf> <championshipId> [--participants-only]
 */
import { readFileSync } from "fs";
import { runSchedulePdfImport } from "../services/schedule-import/schedule-import.service";

const pdfPath = process.argv[2];
const championshipId = process.argv[3];
const participantsOnly = process.argv.includes("--participants-only");

if (!pdfPath || !championshipId) {
  console.error("Uso: npx tsx scripts/run-schedule-import.ts <pdf> <championshipId> [--participants-only]");
  process.exit(1);
}

async function main() {
  const buffer = readFileSync(pdfPath);
  const result = await runSchedulePdfImport({
    buffer,
    fileName: pdfPath.split("/").pop() ?? "tabela.pdf",
    championshipId,
    autoCreateCategory: true,
    participantsOnly,
  });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
