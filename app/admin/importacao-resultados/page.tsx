import { MatchResultsCsvImportPanel } from "@/components/admin/MatchResultsCsvImportPanel";

export const metadata = { title: "Importar resultados" };

export default function AdminImportacaoResultadosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Importar resultados</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Atualize placares de jogos já importados do Paulista de Base. A classificação dos grupos
          afetados é recalculada automaticamente. Você pode enviar CSV manualmente ou usar link direto
          da Federação.
        </p>
      </div>
      <MatchResultsCsvImportPanel />
    </div>
  );
}
