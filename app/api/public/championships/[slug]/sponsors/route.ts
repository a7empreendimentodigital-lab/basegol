import { getActiveChampionshipSponsorsBySlug } from "@/services/championship-sponsor.service";
import type { ChampionshipSponsorPlacement } from "@prisma/client";
import { fail, ok } from "@/utils/api-response";

type RouteCtx = { params: Promise<{ slug: string }> };

export async function GET(req: Request, { params }: RouteCtx) {
  try {
    const { slug } = await params;
    const placement = new URL(req.url).searchParams.get("placement") as
      | ChampionshipSponsorPlacement
      | null;
    if (!placement || !["SIDEBAR_LEFT", "SIDEBAR_RIGHT"].includes(placement)) {
      return fail("placement inválido", 400);
    }
    const items = await getActiveChampionshipSponsorsBySlug(slug, placement);
    return ok({ items });
  } catch {
    return fail("Erro ao carregar patrocinadores", 500);
  }
}
