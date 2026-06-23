import { NextResponse } from "next/server";
import { contentTypeForExtension } from "@/lib/upload-mime";
import { readLocalUploadFile } from "@/lib/upload-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serve arquivos de upload em /uploads/* a partir do disco.
 *
 * O App Router não garante servir arquivos gravados em runtime em public/uploads
 * (standalone, PM2 com cwd diferente, etc.). Esta rota lê de storage/uploads e
 * public/uploads legado via readLocalUploadFile().
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  if (!segments?.length) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const fileName = segments[segments.length - 1]!;
  const buffer = await readLocalUploadFile(fileName);
  if (!buffer) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": contentTypeForExtension(fileName),
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
