import { z } from "zod";
import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { canOperateMatch } from "@/services/operator.service";
import { getMatchLineupBoard, saveTeamLineup } from "@/services/lineup.service";
import { fail, ok } from "@/utils/api-response";

const saveSchema = z.object({
  side: z.enum(["home", "away"]),
  entries: z.array(
    z.object({
      athleteId: z.string().min(1),
      role: z.enum(["STARTER", "SUBSTITUTE"]).default("STARTER"),
      shirtNumber: z.number().int().min(0).max(99).nullable().optional(),
    })
  ),
});

async function authorize(matchId: string) {
  const user = await getSessionUserOrThrow();
  const role = user.role.slug.toUpperCase();
  if (!hasRole(role, ["OPERADOR_DE_PARTIDA", "SUPER_ADMIN", "ADMIN_LIGA"])) {
    return { error: fail("Sem permissão", 403) };
  }
  if (
    !(await canOperateMatch(
      user.id,
      matchId,
      hasRole(role, ["SUPER_ADMIN", "ADMIN_LIGA"])
    ))
  ) {
    return { error: fail("Operador não autorizado para esta partida", 403) };
  }
  return { user };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: matchId } = await params;
    const auth = await authorize(matchId);
    if (auth.error) return auth.error;

    const board = await getMatchLineupBoard(matchId);
    if (!board) return fail("Partida não encontrada", 404);
    return ok(board);
  } catch {
    return fail("Não autenticado", 401);
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: matchId } = await params;
    const auth = await authorize(matchId);
    if (auth.error) return auth.error;

    const parsed = saveSchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail("Dados inválidos", 400, parsed.error.flatten());
    }

    const board = await getMatchLineupBoard(matchId);
    if (!board) return fail("Partida não encontrada", 404);

    const teamId = parsed.data.side === "home" ? board.home.teamId : board.away.teamId;
    await saveTeamLineup(matchId, teamId, parsed.data.entries);

    const updated = await getMatchLineupBoard(matchId);
    return ok(updated);
  } catch (e) {
    if (e instanceof Error && e.message === "INVALID_TEAM") {
      return fail("Time inválido para esta partida", 400);
    }
    return fail("Não autenticado", 401);
  }
}
