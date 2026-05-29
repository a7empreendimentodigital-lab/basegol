import { getSessionUserOrThrow } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/utils/api-response";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const user = await getSessionUserOrThrow();
    const { clubId } = await params;
    await prisma.favorite.deleteMany({
      where: { userId: user.id, type: "CLUB", entityId: clubId },
    });
    return ok({ deleted: true });
  } catch {
    return fail("Não autenticado", 401);
  }
}

