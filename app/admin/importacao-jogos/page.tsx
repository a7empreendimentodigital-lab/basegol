import { ScheduleMatchesImportPanel } from "@/components/admin/ScheduleMatchesImportPanel";

export const metadata = { title: "Importar jogos" };

export default function AdminImportacaoJogosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Importar jogos (Paulista)</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Importe partidas do PDF oficial usando clubes e grupos já cadastrados (Sub-11 e Sub-12).
          Gere a prévia, confira rodada e grupo, e só então salve. Atletas não são alterados.
        </p>
      </div>
      <ScheduleMatchesImportPanel />
    </div>
  );
}
