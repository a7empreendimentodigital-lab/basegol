import { MatchOperationLayout } from "@/components/match-operator/MatchOperationLayout";

export default async function PartidaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const basePath = `/partida/${id}`;

  return (
    <div className="min-h-screen bg-pitch">
      <main className="p-4 md:p-6 max-w-5xl mx-auto w-full">
        <MatchOperationLayout
          matchId={id}
          basePath={basePath}
          backHref="/operador"
          backLabel="Voltar às partidas"
        >
          {children}
        </MatchOperationLayout>
      </main>
    </div>
  );
}
