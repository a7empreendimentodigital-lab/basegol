import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { revalidatePublicContent } from "@/lib/revalidate-public-content";
import { purgeMatchesOnly } from "@/services/match-purge.service";
import { fail, ok } from "@/utils/api-response";

export const maxDuration = 300;

async function ensureAdmin() {
  const user = await getSessionUserOrThrow();
  const role = user.role.slug.toUpperCase();
  if (!hasRole(role, ["SUPER_ADMIN", "ADMIN_LIGA"])) {
    throw new Error("FORBIDDEN");
  }
}

export async function POST(req: Request) {
  try {
    await ensureAdmin();
    const body = (await req.json().catch(() => ({}))) as {
      championshipId?: string;
      dryRun?: boolean;
      confirm?: boolean;
    };

    if (!body.confirm && !body.dryRun) {
      return fail('Confirmação obrigatória (envie confirm: true).', 400);
    }

    const result = await purgeMatchesOnly({
      championshipId: body.championshipId,
      dryRun: body.dryRun === true,
    });

    if (!body.dryRun) {
      revalidatePublicContent();
    }

    return ok(result);
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return fail("Sem permissão", 403);
    }
    return fail(e instanceof Error ? e.message : "Erro ao apagar jogos", 500);
  }
}
