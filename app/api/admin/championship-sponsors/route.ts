import { ensureGlobalAdmin } from "@/lib/admin-api-guard";
import { listAllChampionshipSponsorsForGlobalAdmin } from "@/services/championship-sponsor.service";
import { fail, ok } from "@/utils/api-response";

export async function GET() {
  try {
    await ensureGlobalAdmin();
    const items = await listAllChampionshipSponsorsForGlobalAdmin();
    return ok({ items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "FORBIDDEN") return fail("Sem permissão", 403);
    return fail("Não autenticado", 401);
  }
}
