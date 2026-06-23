import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/utils/api-response";
import { normalizeImageSrc } from "@/lib/image-url";
import { isAllowedUploadMime, resolveUploadMimeType } from "@/lib/upload-mime";
import { storeUploadedFile } from "@/lib/upload-storage";
import { UPLOAD_MAX_BYTES } from "@/lib/upload-config";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return fail("Não autenticado", 401);
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return fail("Arquivo inválido", 400);
    }

    if (file.size === 0) {
      return fail("Arquivo vazio", 400);
    }

    if (file.size > UPLOAD_MAX_BYTES) {
      return fail(`Arquivo muito grande. Máximo ${UPLOAD_MAX_BYTES / 1024 / 1024}MB`, 400);
    }

    const allowDocs = formData.get("allowDocuments") === "true";
    const mimeType = resolveUploadMimeType(file.name, file.type);
    if (!isAllowedUploadMime(mimeType, allowDocs)) {
      return fail(
        `Tipo de arquivo não permitido${mimeType ? ` (${mimeType})` : ""}. Use PNG, JPG, WEBP ou SVG.`,
        400
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const category = String(formData.get("category") ?? "general");
    const title = String(formData.get("title") ?? file.name);

    const stored = await storeUploadedFile({
      buffer: bytes,
      originalName: file.name,
      contentType: mimeType,
      category,
    });

    const url = normalizeImageSrc(stored.url) ?? stored.url;

    const asset = await prisma.mediaAsset.create({
      data: {
        type: mimeType.startsWith("image/") ? "IMAGE" : "DOCUMENT",
        category,
        title,
        originalName: file.name,
        mimeType,
        url,
        sizeBytes: bytes.length,
        uploadedBy: session.user.id,
      },
    });

    console.info("[upload] ok", {
      storage: stored.storage,
      userId: session.user.id,
      category,
      url,
      assetId: asset.id,
    });

    return ok({ url, assetId: asset.id });
  } catch (e) {
    console.error("[upload] error", e);
    const message = e instanceof Error ? e.message : "Falha no upload";
    return fail(message, 500);
  }
}
