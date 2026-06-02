import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { syncGroupTeamsFromDefaultCsv } from "@/services/group-roster-sync.service";
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
      category?: string;
      dryRun?: boolean;
    };

    const result = await syncGroupTeamsFromDefaultCsv({
      categoryFilter: body.category ?? null,
      dryRun: body.dryRun === true,
    });

    return ok(result);
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return fail("Sem permissão", 403);
    }
    return fail(e instanceof Error ? e.message : "Erro ao sincronizar grupos", 500);
  }
}
