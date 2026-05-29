import { redirect } from "next/navigation";

export default async function OperadorPartidaRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/partida/${id}/placar`);
}
