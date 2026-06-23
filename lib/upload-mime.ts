import path from "path";
import {
  UPLOAD_ALLOWED_DOCUMENT_TYPES,
  UPLOAD_ALLOWED_IMAGE_TYPES,
} from "@/lib/upload-config";

const EXT_TO_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

/**
 * Alguns browsers/envios (mobile, VPS) mandam type vazio ou application/octet-stream.
 * Inferimos pelo nome do arquivo quando necessário.
 */
export function resolveUploadMimeType(fileName: string, reportedMime: string): string {
  const mime = reportedMime?.trim().toLowerCase();
  if (mime && mime !== "application/octet-stream") {
    return mime === "image/jpg" ? "image/jpeg" : mime;
  }

  const ext = path.extname(fileName).toLowerCase();
  return EXT_TO_MIME[ext] ?? mime ?? "";
}

export function isAllowedUploadMime(mime: string, allowDocs: boolean): boolean {
  if (!mime) return false;

  const allowed = allowDocs
    ? [...UPLOAD_ALLOWED_IMAGE_TYPES, ...UPLOAD_ALLOWED_DOCUMENT_TYPES]
    : [...UPLOAD_ALLOWED_IMAGE_TYPES];

  return (allowed as readonly string[]).includes(mime);
}

export function contentTypeForExtension(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  return EXT_TO_MIME[ext] ?? "application/octet-stream";
}
