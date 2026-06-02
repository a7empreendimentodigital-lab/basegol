import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { revalidatePublicContent } from "@/lib/revalidate-public-content";
import { syncFixturesFromFpfPack } from "@/services/group-fixtures-sync.service";
import { fail, ok } from "@/utils/api-response";

export const maxDuration = 300;

async function ensureAdmin() {
  const user = await getSessionUserOrThrow();
  const role = user.role.slug.toUpperCase();
  if (!hasRole(role, ["SUPER_ADMIN", "ADMIN_LIGA"])) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function POST(req: Request) {
  try {
    const user = await ensureAdmin();
    const body = (await req.json().catch(() => ({}))) as {
      category?: string;
      dryRun?: boolean;
      syncRosterFirst?: boolean;
      championshipId?: string;
    };

    const result = await syncFixturesFromFpfPack({
      categoryFilter: body.category ?? null,
      dryRun: body.dryRun === true,
      syncRosterFirst: body.syncRosterFirst !== false,
      championshipId: body.championshipId,
      createdById: user.id,
    });

    if (!body.dryRun) {
      revalidatePublicContent();
    }

    return ok(result);
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return fail("Sem permissão", 403);
    }
    return fail(e instanceof Error ? e.message : "Erro ao atualizar jogos", 500);
  }
}
