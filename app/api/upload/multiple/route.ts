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
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);
    if (files.length === 0) {
      return fail("Nenhum arquivo enviado", 400);
    }

    const category = String(formData.get("category") ?? "general");
    const results: { url: string; assetId: string }[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (file.size === 0) {
        errors.push(`${file.name}: arquivo vazio`);
        continue;
      }
      if (file.size > UPLOAD_MAX_BYTES) {
        errors.push(`${file.name}: arquivo muito grande`);
        continue;
      }

      const mimeType = resolveUploadMimeType(file.name, file.type);
      if (!isAllowedUploadMime(mimeType, false)) {
        errors.push(`${file.name}: tipo não permitido`);
        continue;
      }

      try {
        const bytes = Buffer.from(await file.arrayBuffer());
        const stored = await storeUploadedFile({
          buffer: bytes,
          originalName: file.name,
          contentType: mimeType,
          category,
        });
        const url = normalizeImageSrc(stored.url) ?? stored.url;

        const asset = await prisma.mediaAsset.create({
          data: {
            type: "IMAGE",
            category,
            title: file.name,
            originalName: file.name,
            mimeType,
            url,
            sizeBytes: bytes.length,
            uploadedBy: session.user.id,
          },
        });
        results.push({ url, assetId: asset.id });
      } catch (e) {
        errors.push(
          `${file.name}: ${e instanceof Error ? e.message : "falha no envio"}`
        );
      }
    }

    if (results.length === 0) {
      const detail = errors.length > 0 ? errors.join("; ") : "Nenhum arquivo válido foi enviado";
      return fail(detail, 400);
    }

    console.info("[upload] multiple ok", {
      count: results.length,
      userId: session.user.id,
      category,
    });

    return ok({ uploaded: results, warnings: errors.length > 0 ? errors : undefined });
  } catch (e) {
    console.error("[upload] multiple error", e);
    return fail(e instanceof Error ? e.message : "Falha no upload", 500);
  }
}
