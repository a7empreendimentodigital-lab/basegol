import { normalizeImageSrc } from "@/lib/image-url";
import { parseApiResponse } from "@/lib/api-client";
import type { MediaCategory } from "@/lib/upload-config";

export type UploadApiResult = {
  url: string;
  assetId: string;
};

export async function parseUploadError(res: Response): Promise<string> {
  const json = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
  };
  if (json && typeof json === "object" && json.ok === false && json.error) {
    return json.error;
  }
  return json.error || `Falha no upload (${res.status})`;
}

type UploadFileOptions = {
  category?: MediaCategory | string;
  title?: string;
  allowDocuments?: boolean;
};

/**
 * Envia arquivo para /api/upload (requer sessão autenticada no browser).
 */
export async function uploadFileToApi(
  file: File,
  options: UploadFileOptions = {}
): Promise<UploadApiResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("category", options.category ?? "general");
  form.append("title", options.title ?? file.name);
  if (options.allowDocuments) {
    form.append("allowDocuments", "true");
  }

  const res = await fetch("/api/upload", {
    method: "POST",
    body: form,
    credentials: "same-origin",
  });

  if (!res.ok) {
    throw new Error(await parseUploadError(res));
  }

  const data = await parseApiResponse<UploadApiResult>(res);
  if (!data.url) {
    throw new Error("URL do upload não retornada");
  }

  return {
    ...data,
    url: normalizeImageSrc(data.url) ?? data.url,
  };
}
