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
    const sourceUrl = String(form.get("sourceUrl") ?? "").trim();
    const championshipId = String(form.get("championshipId") ?? "").trim();
    const categoryHint = String(form.get("categoryHint") ?? "").trim() || undefined;

    if (!championshipId) return fail("Selecione o campeonato.", 400);
    let buffer: Buffer | null = null;
    if (file instanceof File) {
      const lower = file.name.toLowerCase();
      if (!lower.endsWith(".csv") && !lower.endsWith(".txt")) {
        return fail("O arquivo deve ser CSV (.csv ou .txt).", 400);
      }
      if (file.size > MAX_BYTES) return fail("Arquivo muito grande (máx. 8 MB).", 400);
      buffer = Buffer.from(await file.arrayBuffer());
    } else if (sourceUrl) {
      if (!/^https?:\/\//i.test(sourceUrl)) {
        return fail("Link inválido. Informe URL completa (http/https).", 400);
      }
      const res = await fetch(sourceUrl, {
        method: "GET",
        headers: { Accept: "text/csv,text/plain,application/octet-stream,*/*" },
        cache: "no-store",
      });
      if (!res.ok) {
        return fail(`Não foi possível baixar o arquivo da Federação (HTTP ${res.status}).`, 400);
      }
      const arr = await res.arrayBuffer();
      if (arr.byteLength > MAX_BYTES) {
        return fail("Arquivo remoto muito grande (máx. 8 MB).", 400);
      }
      buffer = Buffer.from(arr);
    } else {
      return fail("Envie um CSV ou informe o link da Federação.", 400);
    }

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
