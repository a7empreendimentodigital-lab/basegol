import path from "path";
import fs from "fs/promises";
import { put, del } from "@vercel/blob";
import { generateUploadStem } from "@/lib/generate-id";

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

export function usesRemoteBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

/** VPS / servidor próprio: grava em public/uploads sem Vercel Blob. */
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

async function storeToLocalDisk(input: StoreUploadInput): Promise<StoreUploadResult> {
  const fileName = buildFileName(input.originalName);
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, fileName), input.buffer);
  return { url: `/uploads/${fileName}`, storage: "local" };
}

/**
 * Persiste arquivo em Vercel Blob (BLOB_READ_WRITE_TOKEN) ou em public/uploads
 * (desenvolvimento ou UPLOAD_STORAGE=local na VPS).
 */
export async function storeUploadedFile(input: StoreUploadInput): Promise<StoreUploadResult> {
  if (usesRemoteBlobStorage()) {
    return storeToVercelBlob(input);
  }

  if (usesLocalUploadStorage()) {
    if (process.env.NODE_ENV === "production") {
      console.info("[upload] UPLOAD_STORAGE=local — gravando em public/uploads");
    } else {
      console.warn(
        "[upload] BLOB_READ_WRITE_TOKEN ausente — usando public/uploads só em desenvolvimento."
      );
    }
    return storeToLocalDisk(input);
  }

  throw new Error(
    "Upload indisponível: configure BLOB_READ_WRITE_TOKEN (Vercel Blob) ou UPLOAD_STORAGE=local (VPS)."
  );
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
