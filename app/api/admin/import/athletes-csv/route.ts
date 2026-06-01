import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import {
  previewAthletesCsvImport,
  runAthletesCsvImport,
} from "@/services/athlete-import/athlete-import.service";
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

    if (!(file instanceof File)) return fail("Envie o arquivo CSV de atletas.", 400);
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".csv") && !lower.endsWith(".txt")) {
      return fail("O arquivo deve ser CSV (.csv ou .txt).", 400);
    }
    if (file.size > MAX_BYTES) return fail("Arquivo muito grande (máx. 8 MB).", 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const input = { buffer };

    if (action === "preview") {
      const preview = await previewAthletesCsvImport(input);
      return ok(preview);
    }

    const result = await runAthletesCsvImport(input);
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
