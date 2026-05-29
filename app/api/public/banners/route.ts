import type { BannerPlacement } from "@prisma/client";
import { getActiveBannersByPlacement } from "@/services/banner.service";
import { fail, ok } from "@/utils/api-response";

const PLACEMENTS: BannerPlacement[] = ["HERO_CAROUSEL", "SIDEBAR_LEFT", "SIDEBAR_RIGHT"];

export async function GET(req: Request) {
  try {
    const placement = new URL(req.url).searchParams.get("placement") as BannerPlacement | null;
    if (!placement || !PLACEMENTS.includes(placement)) {
      return fail("placement inválido", 400);
    }
    const banners = await getActiveBannersByPlacement(placement);
    return ok(banners);
  } catch {
    return fail("Erro ao carregar banners", 500);
  }
}
