import { searchPublic } from "@/services/search.service";
import { fail, ok } from "@/utils/api-response";

export async function GET(req: Request) {
  try {
    const q = new URL(req.url).searchParams.get("q") ?? "";
    const results = await searchPublic(q);
    return ok(results);
  } catch {
    return fail("Busca indisponível", 500);
  }
}
