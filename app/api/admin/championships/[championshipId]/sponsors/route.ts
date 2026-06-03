import { revalidatePublicContent } from "@/lib/revalidate-public-content";
import { requireChampionshipScopedAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { listChampionshipSponsorsAdmin } from "@/services/championship-sponsor.service";
import {
  championshipSponsorCreateSchema,
} from "@/utils/zod-schemas/championship-sponsor.schemas";
import { fail, ok } from "@/utils/api-response";
import { formatPrismaError } from "@/lib/prisma-user-error";

type RouteCtx = { params: Promise<{ championshipId: string }> };

function normalizeLink(link?: string | null) {
  const v = link?.trim();
  return v ? v : null;
}

export async function GET(_req: Request, { params }: RouteCtx) {
  try {
    const { championshipId } = await params;
    await requireChampionshipScopedAdmin(championshipId);
    const items = await listChampionshipSponsorsAdmin(championshipId);
    return ok({ items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "FORBIDDEN") return fail("Sem permissão", 403);
    return fail("Não autenticado", 401);
  }
}

export async function POST(req: Request, { params }: RouteCtx) {
  try {
    const { championshipId } = await params;
    await requireChampionshipScopedAdmin(championshipId);
    const body = championshipSponsorCreateSchema.parse(await req.json());
    const created = await prisma.championshipSponsor.create({
      data: {
        championshipId,
        name: body.name,
        logoUrl: body.logoUrl ?? null,
        linkUrl: normalizeLink(body.linkUrl),
        placement: body.placement,
        order: body.order,
        isActive: body.isActive,
      },
    });
    revalidatePublicContent();
    return ok(created, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "FORBIDDEN") return fail("Sem permissão", 403);
    return fail(formatPrismaError(e), 400);
  }
}
