import { getChampionshipPortalBase } from "@/services/championship-portal.service";
import { getHomeSidebarDataForChampionship } from "@/services/home.service";
import { fail, ok } from "@/utils/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const slug = new URL(req.url).searchParams.get("championshipSlug");
    if (slug) {
      const championship = await getChampionshipPortalBase(slug);
      if (!championship) {
        return fail("Campeonato não encontrado", 404);
      }
      const data = await getHomeSidebarDataForChampionship(championship.id, 4);
      return ok(data);
    }
    return ok({
      categories: [],
      standingsByCategory: {},
      scorersByCategory: {},
    });
  } catch {
    return fail("Não foi possível carregar dados da sidebar", 500);
  }
}
