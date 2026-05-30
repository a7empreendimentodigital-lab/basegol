import { getPublicSiteConfig } from "@/lib/site-config";
import { fail, ok } from "@/utils/api-response";

export const revalidate = 120;

export async function GET() {
  try {
    const config = await getPublicSiteConfig();
    return ok(config);
  } catch {
    return fail("Não foi possível carregar configurações públicas", 500);
  }
}
