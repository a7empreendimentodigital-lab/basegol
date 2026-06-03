import { revalidatePublicContent } from "@/lib/revalidate-public-content";
import { requireChampionshipSponsorAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { championshipSponsorUpdateSchema } from "@/utils/zod-schemas/championship-sponsor.schemas";
import { fail, ok } from "@/utils/api-response";
import { formatPrismaError } from "@/lib/prisma-user-error";

type RouteCtx = { params: Promise<{ championshipId: string; sponsorId: string }> };

function normalizeLink(link?: string | null) {
  const v = link?.trim();
  return v ? v : null;
}

export async function PATCH(req: Request, { params }: RouteCtx) {
  try {
    const { championshipId, sponsorId } = await params;
    await requireChampionshipSponsorAdmin(championshipId);
    const existing = await prisma.championshipSponsor.findFirst({
      where: { id: sponsorId, championshipId },
    });
    if (!existing) return fail("Patrocinador não encontrado", 404);

    const body = championshipSponsorUpdateSchema.parse(await req.json());
    const updated = await prisma.championshipSponsor.update({
      where: { id: sponsorId },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl } : {}),
        ...(body.linkUrl !== undefined ? { linkUrl: normalizeLink(body.linkUrl) } : {}),
        ...(body.placement !== undefined ? { placement: body.placement } : {}),
        ...(body.order !== undefined ? { order: body.order } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      },
    });
    revalidatePublicContent();
    return ok(updated);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "FORBIDDEN") return fail("Sem permissão", 403);
    return fail(formatPrismaError(e), 400);
  }
}

export async function DELETE(_req: Request, { params }: RouteCtx) {
  try {
    const { championshipId, sponsorId } = await params;
    await requireChampionshipSponsorAdmin(championshipId);
    const existing = await prisma.championshipSponsor.findFirst({
      where: { id: sponsorId, championshipId },
    });
    if (!existing) return fail("Patrocinador não encontrado", 404);
    await prisma.championshipSponsor.delete({ where: { id: sponsorId } });
    revalidatePublicContent();
    return ok({ deleted: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "FORBIDDEN") return fail("Sem permissão", 403);
    return fail("Não autenticado", 401);
  }
}
