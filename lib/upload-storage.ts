import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";
import { put, del } from "@vercel/blob";

export type StoreUploadInput = {
  buffer: Buffer;
  originalName: string;
  contentType: string;
  category?: string;
};

export type StoreUploadResult = {
  url: string;
  storage: "vercel-blob" | "local-dev";
};

function sanitizeCategory(category?: string): string {
  const raw = (category ?? "general").trim().toLowerCase();
  const safe = raw.replace(/[^a-z0-9_-]/g, "");
  return safe || "general";
}

function buildFileName(originalName: string): string {
  const ext = path.extname(originalName) || ".bin";
  return `${Date.now()}-${randomUUID()}${ext}`;
}

export function usesRemoteBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function isRemoteBlobUrl(url: string): boolean {
  return (
    url.startsWith("https://") &&
    (url.includes(".blob.vercel-storage.com") || url.includes("public.blob.vercel-storage.com"))
  );
}

export function isLocalDevUploadUrl(url: string): boolean {
  return url.startsWith("/uploads/");
}

async function storeToVercelBlob(input: StoreUploadInput): Promise<StoreUploadResult> {
  const fileName = buildFileName(input.originalName);
  const category = sanitizeCategory(input.category);
  const pathname = `basegol/${category}/${fileName}`;

  const blob = await put(pathname, input.buffer, {
    access: "public",
    contentType: input.contentType,
    addRandomSuffix: false,
  });

  return { url: blob.url, storage: "vercel-blob" };
}

async function storeToLocalDev(input: StoreUploadInput): Promise<StoreUploadResult> {
  const fileName = buildFileName(input.originalName);
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, fileName), input.buffer);
  return { url: `/uploads/${fileName}`, storage: "local-dev" };
}

/**
 * Persiste arquivo em storage online (Vercel Blob) quando BLOB_READ_WRITE_TOKEN está definido.
 * Em desenvolvimento sem token, grava em public/uploads apenas para testes locais.
 */
export async function storeUploadedFile(input: StoreUploadInput): Promise<StoreUploadResult> {
  if (usesRemoteBlobStorage()) {
    return storeToVercelBlob(input);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Upload indisponível: configure BLOB_READ_WRITE_TOKEN (Vercel Blob) nas variáveis de ambiente."
    );
  }

  console.warn(
    "[upload] BLOB_READ_WRITE_TOKEN ausente — usando public/uploads só em desenvolvimento."
  );
  return storeToLocalDev(input);
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

  if (isLocalDevUploadUrl(url)) {
    const filePath = path.join(process.cwd(), "public", url);
    try {
      await fs.unlink(filePath);
    } catch {
      // arquivo pode já ter sido removido
    }
  }
}
