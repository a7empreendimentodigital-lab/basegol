import { z } from "zod";
import {
  recordChampionshipSponsorClick,
  recordChampionshipSponsorImpression,
} from "@/services/championship-sponsor.service";
import { fail, ok } from "@/utils/api-response";

type RouteCtx = { params: Promise<{ slug: string }> };

const bodySchema = z.object({
  sponsorId: z.string().min(1),
  type: z.enum(["impression", "click"]),
});

export async function POST(req: Request, { params }: RouteCtx) {
  try {
    const { slug } = await params;
    const { sponsorId, type } = bodySchema.parse(await req.json());

    const recorded =
      type === "impression"
        ? await recordChampionshipSponsorImpression(slug, sponsorId)
        : await recordChampionshipSponsorClick(slug, sponsorId);

    if (!recorded) return fail("Patrocinador não encontrado", 404);
    return ok({ recorded: true });
  } catch {
    return fail("Requisição inválida", 400);
  }
}
