import { z } from "zod";
import { revalidatePublicContent } from "@/lib/revalidate-public-content";
import { requireChampionshipSponsorAdmin } from "@/lib/admin-auth";
import { reorderChampionshipSponsors } from "@/services/championship-sponsor.service";
import { fail, ok } from "@/utils/api-response";

type RouteCtx = { params: Promise<{ championshipId: string }> };

const bodySchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export async function PATCH(req: Request, { params }: RouteCtx) {
  try {
    const { championshipId } = await params;
    await requireChampionshipSponsorAdmin(championshipId);
    const { orderedIds } = bodySchema.parse(await req.json());
    await reorderChampionshipSponsors(championshipId, orderedIds);
    revalidatePublicContent();
    return ok({ reordered: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "FORBIDDEN") return fail("Sem permissão", 403);
    if (msg === "INVALID_ORDER") return fail("Ordem inválida", 400);
    return fail("Erro ao reordenar", 400);
  }
}
