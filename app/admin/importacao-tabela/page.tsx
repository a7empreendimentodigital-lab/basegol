import { SchedulePdfImportPanel } from "@/components/admin/SchedulePdfImportPanel";

export default function AdminImportacaoTabelaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Importar tabela PDF</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Envie a tabela oficial da Federação Paulista (um PDF por vez). Pode usar arquivos
          separados — por exemplo um PDF só do Sub-11 e outro só do Sub-12 — no mesmo campeonato.
          Clubes repetidos são reutilizados; jogos iguais não duplicam.
        </p>
      </div>
      <SchedulePdfImportPanel />
    </div>
  );
}
