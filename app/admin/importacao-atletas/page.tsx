import { AthletesCsvImportPanel } from "@/components/admin/AthletesCsvImportPanel";

export const metadata = { title: "Importar atletas" };

export default function AdminImportacaoAtletasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Importar atletas</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Importe elencos por clube via CSV. Clubes precisam estar cadastrados. Reimportar atualiza
          posição, número e categoria sem duplicar atletas.
        </p>
      </div>
      <AthletesCsvImportPanel />
    </div>
  );
}
