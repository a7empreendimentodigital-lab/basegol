import path from "node:path";
import { pathToFileURL } from "node:url";
import { PDFParse } from "pdf-parse";

let workerReady = false;

/** pdfjs no Next.js exige worker com caminho absoluto (evita erro em .next/server/chunks). */
function ensurePdfWorker(): void {
  if (workerReady) return;

  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "pdf-parse",
    "dist",
    "pdf-parse",
    "cjs",
    "pdf.worker.mjs"
  );

  PDFParse.setWorker(pathToFileURL(workerPath).href);
  workerReady = true;
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  ensurePdfWorker();

  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text ?? "";
  } finally {
    await parser.destroy();
  }
}
