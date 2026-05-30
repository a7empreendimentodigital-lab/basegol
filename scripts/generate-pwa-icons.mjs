/**
 * Gera ícones PWA a partir do favicon oficial (public/assets/favicon.webp).
 * Uso: node scripts/generate-pwa-icons.mjs
 */
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "public/assets/favicon.webp");
const OUT_DIR = path.join(ROOT, "public/icons");
const APP_DIR = path.join(ROOT, "app");

/** Fundo alinhado ao theme PWA (#121212) */
const BG = { r: 18, g: 18, b: 18, alpha: 1 };

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeSquarePng(input, size, dest, paddingRatio = 0) {
  const pad = Math.round(size * paddingRatio);
  const inner = size - pad * 2;

  let pipeline = sharp(input).resize(inner, inner, {
    fit: "contain",
    background: BG,
  });

  if (pad > 0) {
    pipeline = pipeline.extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: BG,
    });
  }

  await pipeline.png({ compressionLevel: 9 }).toFile(dest);
}

async function main() {
  try {
    await fs.access(SOURCE);
  } catch {
    console.error(`[icons] Arquivo não encontrado: ${SOURCE}`);
    process.exit(1);
  }

  await ensureDir(OUT_DIR);

  const tasks = [
    ["favicon-32.png", 32, 0.08],
    ["favicon-16.png", 16, 0.06],
    ["apple-touch-icon.png", 180, 0.1],
    ["icon-192.png", 192, 0.08],
    ["icon-512.png", 512, 0.08],
    ["icon-192-maskable.png", 192, 0.2],
    ["icon-512-maskable.png", 512, 0.2],
  ];

  for (const [name, size, pad] of tasks) {
    const dest = path.join(OUT_DIR, name);
    await writeSquarePng(SOURCE, size, dest, pad);
    console.log(`[icons] ${name}`);
  }

  // Next.js App Router — favicon e Apple na pasta app/
  await writeSquarePng(SOURCE, 32, path.join(APP_DIR, "icon.png"), 0.08);
  await writeSquarePng(SOURCE, 180, path.join(APP_DIR, "apple-icon.png"), 0.1);
  console.log("[icons] app/icon.png");
  console.log("[icons] app/apple-icon.png");

  console.log("[icons] Concluído a partir de public/assets/favicon.webp");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
