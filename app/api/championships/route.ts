import { listPublicChampionships } from "@/services/public.service";
import { fail, ok } from "@/utils/api-response";

export async function GET() {
  try {
    const championships = await listPublicChampionships();
    return ok(championships);
  } catch {
    return fail("Não foi possível listar campeonatos", 500);
  }
}
