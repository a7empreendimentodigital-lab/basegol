import { getMatchById } from "@/services/match.service";
import { fail, ok } from "@/utils/api-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const match = await getMatchById(id);
    if (!match) {
      return fail("Partida não encontrada", 404);
    }
    return ok(match);
  } catch {
    return fail("Não foi possível carregar a partida", 500);
  }
}
