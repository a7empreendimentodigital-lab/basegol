import { MatchResultsCsvImportPanel } from "@/components/admin/MatchResultsCsvImportPanel";
import { RoundResultsPdfImportPanel } from "@/components/admin/RoundResultsPdfImportPanel";

export const metadata = { title: "Importar resultados" };

export default function AdminImportacaoResultadosPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Importar resultados</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Atualize placares do Paulista de Base por rodada (PDF oficial), CSV ou link da Federação.
          A classificação dos grupos afetados é recalculada automaticamente.
        </p>
      </div>
      <RoundResultsPdfImportPanel />
      <MatchResultsCsvImportPanel />
    </div>
  );
}
