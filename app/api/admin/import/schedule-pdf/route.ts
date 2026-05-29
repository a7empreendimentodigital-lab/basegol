import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import {
  getScheduleImport,
  listScheduleImports,
  runSchedulePdfImport,
} from "@/services/schedule-import/schedule-import.service";
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

export async function GET(req: Request) {
  try {
    await ensureAdmin();
    const url = new URL(req.url);
    const importId = url.searchParams.get("id");
    const championshipId = url.searchParams.get("championshipId") ?? undefined;

    if (importId) {
      const record = await getScheduleImport(importId);
      if (!record) return fail("Importação não encontrada", 404);
      return ok(record);
    }

    const history = await listScheduleImports(championshipId);
    return ok(history);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return fail("Sem permissão", 403);
    }
    return fail("Falha ao consultar importações", 500, error instanceof Error ? error.message : undefined);
  }
}

export async function POST(req: Request) {
  try {
    const user = await ensureAdmin();
    const form = await req.formData();
    const file = form.get("file");
    const championshipId = String(form.get("championshipId") ?? "").trim();
    const categoryId = String(form.get("categoryId") ?? "").trim() || undefined;
    const autoCreateCategory = form.get("autoCreateCategory") !== "false";
    const participantsOnly = form.get("participantsOnly") === "true";

    if (!championshipId) return fail("Selecione o campeonato.", 400);
    if (!(file instanceof File)) return fail("Envie o arquivo PDF da tabela.", 400);
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return fail("O arquivo deve ser um PDF.", 400);
    }
    if (file.size > MAX_BYTES) return fail("PDF muito grande (máx. 12 MB).", 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await runSchedulePdfImport({
      buffer,
      fileName: file.name,
      championshipId,
      categoryId,
      createdById: user.id,
      autoCreateCategory,
      participantsOnly,
    });

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
