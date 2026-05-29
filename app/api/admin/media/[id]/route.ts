import path from "path";
import fs from "fs/promises";
import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/utils/api-response";

async function ensureAdmin() {
  const user = await getSessionUserOrThrow();
  const role = user.role.slug.toUpperCase();
  if (!hasRole(role, ["SUPER_ADMIN", "ADMIN_LIGA"])) {
    throw new Error("FORBIDDEN");
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureAdmin();
    const { id } = await params;
    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) return fail("Mídia não encontrada", 404);

    if (asset.url.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", asset.url);
      try {
        await fs.unlink(filePath);
      } catch {
        // arquivo pode já ter sido removido
      }
    }

    await prisma.mediaAsset.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return fail("Sem permissão", 403);
    return fail("Não autenticado", 401);
  }
}
