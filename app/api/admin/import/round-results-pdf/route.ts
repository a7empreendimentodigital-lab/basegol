import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { revalidatePublicContent } from "@/lib/revalidate-public-content";
import {
  previewRoundResultsPdfImport,
  runRoundResultsPdfImport,
} from "@/services/match-results-import/round-results-pdf-import.service";
import { fail, ok } from "@/utils/api-response";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_BYTES = 12 * 1024 * 1024;

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

    if (!championshipId) return fail("Selecione o campeonato.", 400);
    if (!(file instanceof File)) return fail("Envie o PDF da rodada (Tabela FPF).", 400);
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return fail("O arquivo deve ser um PDF.", 400);
    }
    if (file.size > MAX_BYTES) return fail("PDF muito grande (máx. 12 MB).", 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const base = {
      championshipId,
      buffer,
      fileName: file.name,
    };

    if (action === "preview") {
      const preview = await previewRoundResultsPdfImport(base);
      return ok(preview);
    }

    const result = await runRoundResultsPdfImport(base);
    revalidatePublicContent();
    return ok(result, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return fail("Sem permissão", 403);
    }
    const message = error instanceof Error ? error.message : "Falha na importação";
    return fail(message, 500, message);
  }
}
