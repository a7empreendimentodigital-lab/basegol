import { redirect } from "next/navigation";

/** Patrocínios são cadastrados em Banners (posições laterais e carrossel). */
export default function AdminPatrocinadoresRedirectPage() {
  redirect("/admin/banners");
}
