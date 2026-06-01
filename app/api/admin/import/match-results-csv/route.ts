import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import {
  previewMatchResultsCsvImport,
  runMatchResultsCsvImport,
} from "@/services/match-results-import/match-results-import.service";
import { fail, ok } from "@/utils/api-response";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;

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
    await ensureAdmin();
    const form = await req.formData();
    const action = String(form.get("action") ?? "import").toLowerCase();
    const file = form.get("file");
    const championshipId = String(form.get("championshipId") ?? "").trim();
    const categoryHint = String(form.get("categoryHint") ?? "").trim() || undefined;

    if (!championshipId) return fail("Selecione o campeonato.", 400);
    if (!(file instanceof File)) return fail("Envie o arquivo CSV de resultados.", 400);
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".csv") && !lower.endsWith(".txt")) {
      return fail("O arquivo deve ser CSV (.csv ou .txt).", 400);
    }
    if (file.size > MAX_BYTES) return fail("Arquivo muito grande (máx. 8 MB).", 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const base = { buffer, championshipId, categoryHint };

    if (action === "preview") {
      const preview = await previewMatchResultsCsvImport(base);
      return ok(preview);
    }

    const result = await runMatchResultsCsvImport(base);
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
