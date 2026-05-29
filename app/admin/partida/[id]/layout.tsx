import { MatchOperationLayout } from "@/components/match-operator/MatchOperationLayout";

export default async function AdminPartidaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const basePath = `/admin/partida/${id}`;

  return (
    <MatchOperationLayout
      matchId={id}
      basePath={basePath}
      backHref="/admin/placar-ao-vivo"
      backLabel="Voltar ao placar ao vivo"
    >
      {children}
    </MatchOperationLayout>
  );
}
