import { listPublicMatches } from "@/services/public.service";
import { publicMatchesQuerySchema } from "@/utils/zod-schemas";
import { fail, ok } from "@/utils/api-response";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = publicMatchesQuerySchema.safeParse({
      status: searchParams.get("status") ?? undefined,
    });
    if (!parsed.success) {
      return fail("Parâmetros inválidos", 400, parsed.error.flatten());
    }

    const matches = await listPublicMatches(parsed.data.status ?? null);
    return ok(matches);
  } catch {
    return fail("Não foi possível listar partidas", 500);
  }
}
