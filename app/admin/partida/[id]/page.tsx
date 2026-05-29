import { redirect } from "next/navigation";

export default async function AdminPartidaIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/partida/${id}/placar`);
}
