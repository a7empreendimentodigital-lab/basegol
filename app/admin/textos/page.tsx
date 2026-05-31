import { redirect } from "next/navigation";

/** Textos da home e marca ficam em Marca e identidade. */
export default function AdminTextosRedirectPage() {
  redirect("/admin/personalizacao");
}
