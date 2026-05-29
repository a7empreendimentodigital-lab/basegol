import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { sumulaMetaSchema } from "@/lib/sumula-types";
import { canOperateMatch } from "@/services/operator.service";
import { getMatchSumula, updateMatchSumulaMeta } from "@/services/sumula.service";
import { fail, ok } from "@/utils/api-response";

async function ensureOperator(matchId: string) {
  const user = await getSessionUserOrThrow();
  const role = user.role.slug.toUpperCase();
  if (!hasRole(role, ["OPERADOR_DE_PARTIDA", "SUPER_ADMIN", "ADMIN_LIGA"])) {
    throw new Error("FORBIDDEN");
  }
  const privileged = hasRole(role, ["SUPER_ADMIN", "ADMIN_LIGA"]);
  if (!(await canOperateMatch(user.id, matchId, privileged))) {
    throw new Error("UNAUTHORIZED_MATCH");
  }
  return user;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await ensureOperator(id);
    const sumula = await getMatchSumula(id);
    if (!sumula) return fail("Partida não encontrada", 404);
    return ok(sumula);
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return fail("Sem permissão", 403);
    if (e instanceof Error && e.message === "UNAUTHORIZED_MATCH") {
      return fail("Operador não autorizado para esta partida", 403);
    }
    return fail("Falha ao gerar súmula", 500);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await ensureOperator(id);
    const body = await req.json();
    const meta = sumulaMetaSchema.parse(body);
    await updateMatchSumulaMeta(id, meta);
    return ok({ saved: true });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return fail("Sem permissão", 403);
    if (e instanceof Error && e.message === "UNAUTHORIZED_MATCH") {
      return fail("Operador não autorizado para esta partida", 403);
    }
    return fail("Falha ao salvar súmula", 400);
  }
}
