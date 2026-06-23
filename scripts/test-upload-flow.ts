/**
 * Teste ponta a ponta do fluxo de upload (storage + URL + leitura do disco).
 * Não exige servidor HTTP nem sessão — valida a camada usada por /api/upload.
 *
 * Uso: npm run test:upload-flow
 */
import fs from "fs/promises";
import path from "path";
import { generateUploadStem } from "../lib/generate-id";
import { normalizeImageSrc } from "../lib/image-url";
import {
  isAllowedUploadMime,
  resolveUploadMimeType,
} from "../lib/upload-mime";
import {
  getLocalUploadDir,
  getLocalUploadFilePath,
  storeUploadedFile,
} from "../lib/upload-storage";

const MINIMAL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z5BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  process.env.UPLOAD_STORAGE = "local";
  delete process.env.BLOB_READ_WRITE_TOKEN;

  console.log("[1/6] generateUploadStem (node:crypto)");
  const stem = generateUploadStem();
  assert(stem.includes("-"), "stem deve conter UUID");

  console.log("[2/6] resolveUploadMimeType (type vazio → extensão)");
  assert(
    resolveUploadMimeType("foto.jpg", "") === "image/jpeg",
    "jpg sem mime deve resolver para image/jpeg"
  );
  assert(
    resolveUploadMimeType("logo.PNG", "application/octet-stream") === "image/png",
    "octet-stream deve inferir png"
  );
  assert(isAllowedUploadMime("image/webp", false), "webp deve ser permitido");

  console.log("[3/6] storeUploadedFile → disco");
  const stored = await storeUploadedFile({
    buffer: MINIMAL_PNG,
    originalName: "e2e-test.png",
    contentType: "image/png",
    category: "general",
  });
  assert(stored.url.startsWith("/uploads/"), `URL inválida: ${stored.url}`);
  assert(stored.storage === "local", "storage deve ser local");

  const fileName = path.basename(stored.url);
  const filePath = getLocalUploadFilePath(fileName);
  assert(filePath.startsWith(getLocalUploadDir()), "path traversal bloqueado");

  const onDisk = await fs.readFile(filePath);
  assert(onDisk.length === MINIMAL_PNG.length, "arquivo no disco com tamanho errado");

  console.log("[4/6] normalizeImageSrc (exibição na UI)");
  const displayUrl = normalizeImageSrc(stored.url);
  assert(displayUrl === stored.url, "URL normalizada deve ser /uploads/...");

  console.log("[5/6] simular persistência no banco (payload media_assets)");
  const dbPayload = {
    type: "IMAGE" as const,
    category: "general",
    title: "e2e-test.png",
    originalName: "e2e-test.png",
    mimeType: "image/png",
    url: displayUrl,
    sizeBytes: MINIMAL_PNG.length,
    uploadedBy: "test-user",
  };
  assert(dbPayload.url?.startsWith("/uploads/"), "payload URL inválida");

  console.log("[6/6] cleanup");
  await fs.unlink(filePath);

  console.log("\n✓ Fluxo de upload validado:");
  console.log("  selecionar → enviar → salvar em", getLocalUploadDir());
  console.log("  → URL", stored.url, "→ exibir via SafeImage");
}

main().catch((err) => {
  console.error("\n✗ Falha no teste de upload:", err);
  process.exit(1);
});
