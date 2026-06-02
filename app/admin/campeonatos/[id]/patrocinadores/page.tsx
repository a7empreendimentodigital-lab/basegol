import { redirect } from "next/navigation";

/** Patrocinadores são globais no sistema; redireciona para a tela existente. */
export default function ChampionshipAdminSponsorsPage() {
  redirect("/admin/patrocinadores");
}
