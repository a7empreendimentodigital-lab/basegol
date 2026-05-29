import { listPublicAthletes } from "@/services/public.service";
import { fail, ok } from "@/utils/api-response";

export async function GET() {
  try {
    const athletes = await listPublicAthletes();
    return ok(athletes);
  } catch {
    return fail("Não foi possível listar atletas", 500);
  }
}
