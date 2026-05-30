import { getHomeSidebarData } from "@/services/home.service";
import { fail, ok } from "@/utils/api-response";

export const revalidate = 60;

export async function GET() {
  try {
    const data = await getHomeSidebarData(4);
    return ok(data);
  } catch {
    return fail("Não foi possível carregar dados da sidebar", 500);
  }
}
