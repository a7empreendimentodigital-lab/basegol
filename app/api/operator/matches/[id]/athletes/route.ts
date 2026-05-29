import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { canOperateMatch, getMatchAthletesForSide } from "@/services/operator.service";
import { fail, ok } from "@/utils/api-response";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: matchId } = await params;
    const user = await getSessionUserOrThrow();
    const role = user.role.slug.toUpperCase();
    if (!hasRole(role, ["OPERADOR_DE_PARTIDA", "SUPER_ADMIN", "ADMIN_LIGA"])) {
      return fail("Sem permissão", 403);
    }
    if (
      !(await canOperateMatch(
        user.id,
        matchId,
        hasRole(role, ["SUPER_ADMIN", "ADMIN_LIGA"])
      ))
    ) {
      return fail("Operador não autorizado para esta partida", 403);
    }

    const side = new URL(req.url).searchParams.get("side");
    if (side !== "home" && side !== "away") {
      return fail("Informe side=home ou side=away", 400);
    }

    const athletes = await getMatchAthletesForSide(matchId, side);
    return ok(athletes);
  } catch {
    return fail("Não autenticado", 401);
  }
}
