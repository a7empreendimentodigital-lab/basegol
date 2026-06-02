import { revalidatePath } from "next/cache";

const PUBLIC_CONTENT_ENTITIES = new Set([
  "championships",
  "categories",
  "groups",
  "clubs",
  "matches",
]);

export function adminEntityAffectsPublicContent(entity: string): boolean {
  return PUBLIC_CONTENT_ENTITIES.has(entity);
}

/** Invalida páginas públicas após alterar clubes, grupos ou tabelas. */
export function revalidatePublicContent() {
  for (const path of ["/", "/clubes", "/tabelas", "/campeonatos"]) {
    revalidatePath(path);
    revalidatePath(path, "page");
    revalidatePath(path, "layout");
  }
  revalidatePath("/api/public/home-sidebar");
}
