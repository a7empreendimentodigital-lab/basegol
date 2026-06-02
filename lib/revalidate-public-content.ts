import { revalidatePath } from "next/cache";

/** Invalida páginas públicas após alterar clubes, grupos ou tabelas. */
export function revalidatePublicContent() {
  revalidatePath("/clubes");
  revalidatePath("/clubes", "page");
  revalidatePath("/tabelas");
  revalidatePath("/campeonatos");
  revalidatePath("/");
}
