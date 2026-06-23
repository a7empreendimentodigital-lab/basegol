import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { put, del } from "@vercel/blob";
import { generateUploadStem } from "@/lib/generate-id";
import { contentTypeForExtension } from "@/lib/upload-mime";

export type StoreUploadInput = {
  buffer: Buffer;
  originalName: string;
  contentType: string;
  category?: string;
};

export type StoreUploadResult = {
  url: string;
  storage: "vercel-blob" | "local";
};

function sanitizeCategory(category?: string): string {
  const raw = (category ?? "general").trim().toLowerCase();
  const safe = raw.replace(/[^a-z0-9_-]/g, "");
  return safe || "general";
}

function buildFileName(originalName: string): string {
  const ext = path.extname(originalName) || ".bin";
  return `${generateUploadStem()}${ext}`;
}

function isPathInsideDir(filePath: string, dir: string): boolean {
  const resolvedFile = path.resolve(filePath);
  const resolvedDir = path.resolve(dir);
  const prefix = resolvedDir.endsWith(path.sep) ? resolvedDir : `${resolvedDir}${path.sep}`;
  return resolvedFile === resolvedDir || resolvedFile.startsWith(prefix);
}

/**
 * Diretórios onde procurar arquivos (ordem de prioridade).
 * Inclui storage/uploads, public/uploads legado e variantes de cwd (standalone/PM2).
 */
export function getLocalUploadSearchDirs(): string[] {
  const dirs: string[] = [];
  const seen = new Set<string>();

  const add = (dir: string) => {
    const resolved = path.resolve(dir);
    if (seen.has(resolved)) return;
    seen.add(resolved);
    dirs.push(resolved);
  };

  const configured = process.env.UPLOAD_DIR?.trim();
  if (configured) add(configured);

  const cwd = process.cwd();
  add(path.join(cwd, "storage", "uploads"));
  add(path.join(cwd, "public", "uploads"));
  add(path.join(cwd, "..", "storage", "uploads"));
  add(path.join(cwd, "..", "public", "uploads"));
  add(path.join(cwd, "..", "..", "storage", "uploads"));
  add(path.join(cwd, "..", "..", "public", "uploads"));

  return dirs;
}

/** Diretório padrão para novos uploads locais (fora de public/ — servido via app/uploads route). */
export function getLocalUploadDir(): string {
  const configured = process.env.UPLOAD_DIR?.trim();
  if (configured) return path.resolve(configured);
  return path.resolve(process.cwd(), "storage", "uploads");
}

export function getLocalUploadFilePath(fileName: string, baseDir?: string): string {
  const safeName = path.basename(fileName);
  return path.join(baseDir ?? getLocalUploadDir(), safeName);
}

export function usesRemoteBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

/** VPS / servidor próprio: grava em storage/uploads (servido por app/uploads/[...path]). */
export function usesLocalUploadStorage(): boolean {
  const mode = process.env.UPLOAD_STORAGE?.trim().toLowerCase();
  if (mode === "local") return true;
  if (process.env.LOCAL_UPLOAD_STORAGE === "true") return true;
  return process.env.NODE_ENV !== "production";
}

export function isRemoteBlobUrl(url: string): boolean {
  return (
    url.startsWith("https://") &&
    (url.includes(".blob.vercel-storage.com") || url.includes("public.blob.vercel-storage.com"))
  );
}

export function isLocalUploadUrl(url: string): boolean {
  return url.startsWith("/uploads/");
}

/** @deprecated use isLocalUploadUrl */
export function isLocalDevUploadUrl(url: string): boolean {
  return isLocalUploadUrl(url);
}

async function storeToVercelBlob(input: StoreUploadInput): Promise<StoreUploadResult> {
  const fileName = buildFileName(input.originalName);
  const category = sanitizeCategory(input.category);
  const pathname = `basegol/${category}/${fileName}`;

  const blob = await put(pathname, input.buffer, {
    access: "public",
    contentType: input.contentType || contentTypeForExtension(input.originalName),
    addRandomSuffix: false,
  });

  return { url: blob.url, storage: "vercel-blob" };
}

async function storeToLocalDisk(input: StoreUploadInput): Promise<StoreUploadResult> {
  const fileName = buildFileName(input.originalName);
  const uploadDir = getLocalUploadDir();
  await fs.mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, fileName);
  await fs.writeFile(filePath, input.buffer);
  return { url: `/uploads/${fileName}`, storage: "local" };
}

/**
 * Persiste arquivo em Vercel Blob (BLOB_READ_WRITE_TOKEN) ou em storage/uploads
 * (desenvolvimento ou UPLOAD_STORAGE=local na VPS).
 */
export async function storeUploadedFile(input: StoreUploadInput): Promise<StoreUploadResult> {
  if (usesRemoteBlobStorage()) {
    return storeToVercelBlob(input);
  }

  if (usesLocalUploadStorage()) {
    if (process.env.NODE_ENV === "production") {
      console.info("[upload] UPLOAD_STORAGE=local — gravando em", getLocalUploadDir());
    } else {
      console.warn(
        "[upload] BLOB_READ_WRITE_TOKEN ausente — usando storage/uploads em desenvolvimento."
      );
    }
    return storeToLocalDisk(input);
  }

  throw new Error(
    "Upload indisponível: configure BLOB_READ_WRITE_TOKEN (Vercel Blob) ou UPLOAD_STORAGE=local (VPS)."
  );
}

export async function readLocalUploadFile(fileName: string): Promise<Buffer | null> {
  const safeName = path.basename(fileName);
  if (!safeName || safeName === "." || safeName === "..") return null;

  for (const dir of getLocalUploadSearchDirs()) {
    const filePath = path.join(dir, safeName);
    if (!isPathInsideDir(filePath, dir)) continue;
    if (!existsSync(filePath)) continue;

    try {
      return await fs.readFile(filePath);
    } catch {
      // tenta próximo diretório
    }
  }

  return null;
}

export async function deleteStoredFile(url: string): Promise<void> {
  if (isRemoteBlobUrl(url)) {
    try {
      await del(url);
    } catch (e) {
      console.warn("[upload] Falha ao remover blob:", e);
    }
    return;
  }

  if (!isLocalUploadUrl(url)) return;

  const fileName = path.basename(url);
  for (const dir of getLocalUploadSearchDirs()) {
    const filePath = path.join(dir, fileName);
    if (!isPathInsideDir(filePath, dir)) continue;
    try {
      await fs.unlink(filePath);
    } catch {
      // arquivo pode já ter sido removido neste dir
    }
  }
}
