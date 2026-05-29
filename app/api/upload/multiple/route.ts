import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/utils/api-response";
import { UPLOAD_ALLOWED_IMAGE_TYPES, UPLOAD_MAX_BYTES } from "@/lib/upload-config";

export const runtime = "nodejs";

export async function POST(req: Request) {
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
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const results: { url: string; assetId: string }[] = [];

  for (const file of files) {
    if (file.size > UPLOAD_MAX_BYTES) continue;
    if (!UPLOAD_ALLOWED_IMAGE_TYPES.includes(file.type as (typeof UPLOAD_ALLOWED_IMAGE_TYPES)[number])) {
      continue;
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || ".bin";
    const fileName = `${Date.now()}-${randomUUID()}${ext}`;
    await fs.writeFile(path.join(uploadDir, fileName), bytes);
    const url = `/uploads/${fileName}`;

    const asset = await prisma.mediaAsset.create({
      data: {
        type: "IMAGE",
        category,
        title: file.name,
        originalName: file.name,
        mimeType: file.type,
        url,
        sizeBytes: bytes.length,
        uploadedBy: session.user.id,
      },
    });
    results.push({ url, assetId: asset.id });
  }

  if (results.length === 0) {
    return fail("Nenhum arquivo válido foi enviado", 400);
  }

  return ok({ uploaded: results });
}
