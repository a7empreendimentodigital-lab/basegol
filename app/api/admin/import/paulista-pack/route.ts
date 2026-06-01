import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import {
  parsePaulistaPackBuffer,
  previewPaulistaPack,
} from "@/services/paulista-pack-import/paulista-pack-preview";
import { fail, ok } from "@/utils/api-response";

export const runtime = "nodejs";
/** Importação completa pode levar vários minutos (mil jogos). */
export const maxDuration = 300;

const MAX_BYTES = 25 * 1024 * 1024;

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
    const form = await req.formData();
    const action = String(form.get("action") ?? "import").toLowerCase();
    const file = form.get("file");
    const championshipId = String(form.get("championshipId") ?? "").trim();
    const participantsOnly = String(form.get("participantsOnly") ?? "") === "true";

    if (!championshipId) return fail("Selecione o campeonato.", 400);
    if (!(file instanceof File)) return fail("Envie o arquivo JSON do pacote FPF.", 400);
    if (!file.name.toLowerCase().endsWith(".json")) {
      return fail("Use o arquivo basegol_paulista_import_2026.json (ou equivalente).", 400);
    }
    if (file.size > MAX_BYTES) return fail("JSON muito grande (máx. 25 MB).", 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const pack = parsePaulistaPackBuffer(buffer);

    if (action === "preview") {
      return ok(previewPaulistaPack(pack));
    }

    const { runPaulistaPackImport } = await import(
      "@/services/paulista-pack-import/paulista-pack-import.service"
    );

    const result = await runPaulistaPackImport({
      championshipId,
      jsonBuffer: buffer,
      fileName: file.name,
      createdById: user.id,
      participantsOnly,
    });

    return ok(result, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return fail("Sem permissão", 403);
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return fail("Faça login novamente.", 401);
    }
    return fail(
      error instanceof Error ? error.message : "Falha na importação",
      400,
      error instanceof Error ? error.message : undefined
    );
  }
}
