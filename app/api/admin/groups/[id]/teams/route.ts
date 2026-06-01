import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { ensureTeamInGroup } from "@/lib/team-enrollment";
import { prisma } from "@/lib/prisma";
import { removeTeamFromGroup } from "@/services/group-team-admin.service";
import { fail, ok } from "@/utils/api-response";
import { z } from "zod";

async function ensureAdmin() {
  const user = await getSessionUserOrThrow();
  const role = user.role.slug.toUpperCase();
  if (!hasRole(role, ["SUPER_ADMIN", "ADMIN_LIGA"])) {
    throw new Error("FORBIDDEN");
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureAdmin();
    const { id: groupId } = await params;
    const teams = await prisma.team.findMany({
      where: { groupId },
      orderBy: { club: { name: "asc" } },
      include: { club: { select: { id: true, name: true, crestUrl: true } } },
    });
    return ok(teams);
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return fail("Sem permissão", 403);
    return fail("Não autenticado", 401);
  }
}

const bodySchema = z.object({ clubId: z.string().min(1) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureAdmin();
    const { id: groupId } = await params;
    const { clubId } = bodySchema.parse(await req.json());
    const team = await ensureTeamInGroup(groupId, clubId);
    return ok(team, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return fail("Sem permissão", 403);
    if (e instanceof z.ZodError) return fail("Dados inválidos", 400);
    return fail(e instanceof Error ? e.message : "Erro ao inscrever clube", 400);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureAdmin();
    const { id: groupId } = await params;
    const url = new URL(req.url);
    const teamId = url.searchParams.get("teamId");
    const force = url.searchParams.get("force") === "true" || url.searchParams.get("force") === "1";

    if (!teamId) return fail("teamId obrigatório", 400);

    const result = await removeTeamFromGroup(groupId, teamId, { force });
    return ok(result);
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return fail("Sem permissão", 403);
    const message = e instanceof Error ? e.message : "Erro ao remover clube do grupo";
    const needsForce = message.includes("jogo(s) neste grupo");
    return fail(message, needsForce ? 409 : 400, message);
  }
}
