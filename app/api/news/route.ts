import { listPublicNews } from "@/services/public.service";
import { fail, ok } from "@/utils/api-response";

export async function GET() {
  try {
    const news = await listPublicNews();
    return ok(news);
  } catch {
    return fail("Não foi possível listar notícias", 500);
  }
}
