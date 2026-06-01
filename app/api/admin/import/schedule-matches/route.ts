import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import {
  previewScheduleMatchesImport,
  runScheduleMatchesImport,
} from "@/services/schedule-import/schedule-matches-import.service";
import type { ScheduleImportFilters } from "@/services/schedule-import/import-filters";
import { normalizeGroupFilterInput } from "@/services/schedule-import/import-filters";
import { fail, ok } from "@/utils/api-response";

export const runtime = "nodejs";

const MAX_BYTES = 12 * 1024 * 1024;

async function ensureAdmin() {
  const user = await getSessionUserOrThrow();
  const role = user.role.slug.toUpperCase();
  if (!hasRole(role, ["SUPER_ADMIN", "ADMIN_LIGA"])) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

function parseFilters(form: FormData): ScheduleImportFilters {
  const categoryHint = String(form.get("categoryHint") ?? "").trim() || undefined;
  const roundRaw = String(form.get("roundNumber") ?? "").trim();
  const groupRaw = String(form.get("groupName") ?? "").trim();
  const roundNumber = roundRaw ? Number(roundRaw) : undefined;

  return {
    categoryHint,
    roundNumber: Number.isFinite(roundNumber) ? roundNumber : undefined,
    groupName: groupRaw ? normalizeGroupFilterInput(groupRaw) : undefined,
  };
}

export async function POST(req: Request) {
  try {
    const user = await ensureAdmin();
    const form = await req.formData();
    const action = String(form.get("action") ?? "import").toLowerCase();
    const file = form.get("file");
    const championshipId = String(form.get("championshipId") ?? "").trim();
    const categoryId = String(form.get("categoryId") ?? "").trim() || undefined;

    if (!championshipId) return fail("Selecione o campeonato.", 400);
    if (!(file instanceof File)) return fail("Envie o arquivo PDF da tabela.", 400);
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return fail("O arquivo deve ser um PDF.", 400);
    }
    if (file.size > MAX_BYTES) return fail("PDF muito grande (máx. 12 MB).", 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const filters = parseFilters(form);

    const base = {
      buffer,
      fileName: file.name,
      championshipId,
      categoryId,
      createdById: user.id,
      filters,
      matchesOnly: true,
    };

    if (action === "preview") {
      const preview = await previewScheduleMatchesImport(base);
      return ok(preview);
    }

    const result = await runScheduleMatchesImport(base);
    return ok(result, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return fail("Sem permissão", 403);
    }
    return fail(
      error instanceof Error ? error.message : "Falha na importação",
      400,
      error instanceof Error ? error.message : undefined
    );
  }
}
