import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { syncFpfClubsFromCsv } from "@/services/fpf-clubs-seed.service";
import { syncGroupTeamsFromDefaultCsv } from "@/services/group-roster-sync.service";
import { fail, ok } from "@/utils/api-response";

export const maxDuration = 120;

export async function POST() {
  try {
    const user = await getSessionUserOrThrow();
    const role = user.role.slug.toUpperCase();
    if (!hasRole(role, ["SUPER_ADMIN", "ADMIN_LIGA"])) {
      return fail("Sem permissão", 403);
    }

    const clubs = await syncFpfClubsFromCsv();
    let groups = null;
    if (clubs.stillMissing.length === 0) {
      groups = await syncGroupTeamsFromDefaultCsv();
    }

    return ok({ clubs, groups });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Falha ao sincronizar clubes FPF",
      500
    );
  }
}
