import { listPublicClubs } from "@/services/public.service";
import { fail, ok } from "@/utils/api-response";

export async function GET() {
  try {
    const clubs = await listPublicClubs();
    return ok(clubs);
  } catch {
    return fail("Não foi possível listar clubes", 500);
  }
}
