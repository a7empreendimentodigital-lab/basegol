import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { listMatchesForOperator } from "@/services/operator.service";
import { fail, ok } from "@/utils/api-response";

export async function GET() {
  try {
    const user = await getSessionUserOrThrow();
    const role = user.role.slug.toUpperCase();
    if (!hasRole(role, ["OPERADOR_DE_PARTIDA", "SUPER_ADMIN", "ADMIN_LIGA"])) {
      return fail("Sem permissão", 403);
    }
    const matches = await listMatchesForOperator(
      user.id,
      hasRole(role, ["SUPER_ADMIN", "ADMIN_LIGA"])
    );
    return ok(matches);
  } catch {
    return fail("Não autenticado", 401);
  }
}
