/**
 * Importa pacote oficial FPF (pasta com CSVs ou JSON único).
 *
 * Uso:
 *   npx tsx scripts/run-paulista-pack-import.ts <pasta_ou_json> <championshipId> [--participants-only]
 *
 * Exemplo:
 *   npx tsx scripts/run-paulista-pack-import.ts ~/Downloads/basegol_paulista_import_2026 <id>
 *   npx tsx scripts/run-paulista-pack-import.ts ~/Downloads/basegol_paulista_import_2026/basegol_paulista_import_2026.json <id>
 */
import {
  previewPaulistaPack,
  runPaulistaPackImport,
} from "@/services/paulista-pack-import/paulista-pack-import.service";
import { loadPaulistaPack } from "@/services/paulista-pack-import/paulista-pack-loader";

async function main() {
  const sourcePath = process.argv[2];
  const championshipId = process.argv[3];
  const participantsOnly = process.argv.includes("--participants-only");
  const previewOnly = process.argv.includes("--preview");

  if (!sourcePath || !championshipId) {
    console.error(
      "Uso: npx tsx scripts/run-paulista-pack-import.ts <pasta_ou_json> <championshipId> [--participants-only] [--preview]"
    );
    process.exit(1);
  }

  const pack = loadPaulistaPack(sourcePath);
  console.log("=== PRÉVIA DO PACOTE ===");
  console.log(JSON.stringify(previewPaulistaPack(pack), null, 2));

  if (previewOnly) return;

  const result = await runPaulistaPackImport({
    sourcePath,
    championshipId,
    participantsOnly,
    fileName: sourcePath.split("/").pop() ?? "paulista-pack",
  });

  console.log("\n=== IMPORTAÇÃO CONCLUÍDA ===");
  console.log(JSON.stringify(result.summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
