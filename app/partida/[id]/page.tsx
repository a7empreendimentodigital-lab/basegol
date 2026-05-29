import { redirect } from "next/navigation";

export default async function PartidaIndexPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/partida/${id}/placar`);
}
