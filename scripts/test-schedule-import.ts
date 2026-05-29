/**
 * Teste local do parser (sem banco).
 * Uso: npx tsx scripts/test-schedule-import.ts [caminho-do-pdf]
 */
import { readFileSync } from "fs";
import { extractTextFromPdf } from "../services/schedule-import/pdf-text";
import { parseFpPaulistaSchedules } from "../services/schedule-import/fp-paulista-parser";

const pdfPath =
  process.argv[2] ??
  "/Users/crislainemarinho/Downloads/brasao/2745_1.pdf";

async function main() {
  const buffer = readFileSync(pdfPath);
  const text = await extractTextFromPdf(buffer);
  if (process.argv.includes("--dump")) {
    console.log(text.slice(0, 4000));
    console.log("--- total chars:", text.length);
  }
  const schedules = parseFpPaulistaSchedules(text);
  console.log("Categorias detectadas:", schedules.map((s) => s.categoryHint).join(", "));
  for (const parsed of schedules) {
    console.log("---", parsed.categoryHint, "---");
    console.log("Campeonato:", parsed.championshipTitle);
    console.log("Participantes:", parsed.participants.length);
    console.log("Jogos:", parsed.matches.length);
    console.log("Avisos:", parsed.warnings.length);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
