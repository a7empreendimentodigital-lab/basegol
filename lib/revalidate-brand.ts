import { revalidatePath, revalidateTag } from "next/cache";

/** Invalida cache de marca (favicon, logos, manifest) após salvar em Personalização. */
export function revalidateBrandConfig() {
  revalidateTag("brand-config");
  revalidateTag("sidebar-left-banner");
  revalidatePath("/", "layout");
}
