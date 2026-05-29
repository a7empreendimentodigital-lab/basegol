import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/utils/api-response";
import {
  UPLOAD_ALLOWED_DOCUMENT_TYPES,
  UPLOAD_ALLOWED_IMAGE_TYPES,
  UPLOAD_MAX_BYTES,
} from "@/lib/upload-config";

export const runtime = "nodejs";

function isAllowedMime(mime: string, allowDocs: boolean) {
  const allowed = allowDocs
    ? [...UPLOAD_ALLOWED_IMAGE_TYPES, ...UPLOAD_ALLOWED_DOCUMENT_TYPES]
    : [...UPLOAD_ALLOWED_IMAGE_TYPES];
  return allowed.includes(mime as (typeof UPLOAD_ALLOWED_IMAGE_TYPES)[number]);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return fail("Não autenticado", 401);
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return fail("Arquivo inválido", 400);
  }

  if (file.size > UPLOAD_MAX_BYTES) {
    return fail(`Arquivo muito grande. Máximo ${UPLOAD_MAX_BYTES / 1024 / 1024}MB`, 400);
  }

  const allowDocs = formData.get("allowDocuments") === "true";
  if (!isAllowedMime(file.type, allowDocs)) {
    return fail("Tipo de arquivo não permitido", 400);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || ".bin";
  const fileName = `${Date.now()}-${randomUUID()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, fileName), bytes);

  const url = `/uploads/${fileName}`;
  const category = String(formData.get("category") ?? "general");
  const title = String(formData.get("title") ?? file.name);

  const asset = await prisma.mediaAsset.create({
    data: {
      type: file.type.startsWith("image/") ? "IMAGE" : "DOCUMENT",
      category,
      title,
      originalName: file.name,
      mimeType: file.type,
      url,
      sizeBytes: bytes.length,
      uploadedBy: session.user.id,
    },
  });

  return ok({ url, assetId: asset.id });
}
