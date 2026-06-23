/**
 * Teste ponta a ponta do fluxo de upload (storage + URL + leitura do disco).
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
  getLocalUploadSearchDirs,
  getLocalUploadFilePath,
  readLocalUploadFile,
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
  delete process.env.UPLOAD_DIR;

  console.log("[1/7] generateUploadStem (node:crypto)");
  const stem = generateUploadStem();
  assert(stem.includes("-"), "stem deve conter UUID");

  console.log("[2/7] resolveUploadMimeType");
  assert(resolveUploadMimeType("foto.jpg", "") === "image/jpeg", "mime jpg");
  assert(isAllowedUploadMime("image/webp", false), "webp permitido");

  console.log("[3/7] storeUploadedFile → storage/uploads");
  const stored = await storeUploadedFile({
    buffer: MINIMAL_PNG,
    originalName: "e2e-test.png",
    contentType: "image/png",
    category: "general",
  });
  assert(stored.url.startsWith("/uploads/"), `URL inválida: ${stored.url}`);

  const fileName = path.basename(stored.url);
  const filePath = getLocalUploadFilePath(fileName);
  assert(
    filePath.includes(`${path.sep}storage${path.sep}uploads${path.sep}`),
    "deve gravar em storage/uploads"
  );

  const onDisk = await fs.readFile(filePath);
  assert(onDisk.length === MINIMAL_PNG.length, "tamanho no disco");

  console.log("[4/7] readLocalUploadFile (route app/uploads/[...path])");
  const readBack = await readLocalUploadFile(fileName);
  assert(readBack?.length === MINIMAL_PNG.length, "leitura do arquivo falhou");

  console.log("[5/7] legado public/uploads ainda legível");
  const legacyDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(legacyDir, { recursive: true });
  const legacyName = "legacy-public-test.png";
  const legacyPath = path.join(legacyDir, legacyName);
  await fs.writeFile(legacyPath, MINIMAL_PNG);
  const legacyRead = await readLocalUploadFile(legacyName);
  assert(legacyRead?.length === MINIMAL_PNG.length, "legado public/uploads não legível");
  await fs.unlink(legacyPath);

  console.log("[6/7] normalizeImageSrc + payload DB");
  const displayUrl = normalizeImageSrc(stored.url);
  assert(displayUrl === stored.url, "URL normalizada");

  console.log("[7/7] cleanup");
  await fs.unlink(filePath);

  console.log("\n✓ Fluxo validado");
  console.log("  gravar em:", getLocalUploadDir());
  console.log("  buscar em:", getLocalUploadSearchDirs().join(", "));
  console.log("  URL HTTP:  /uploads/<arquivo> (app/uploads/[...path]/route.ts)");
}

main().catch((err) => {
  console.error("\n✗ Falha no teste de upload:", err);
  process.exit(1);
});
