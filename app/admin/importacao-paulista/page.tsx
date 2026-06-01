import { PaulistaPackImportPanel } from "@/components/admin/PaulistaPackImportPanel";

export const metadata = { title: "Importar pacote Paulista FPF" };

export default function AdminImportacaoPaulistaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Importar pacote Paulista (FPF 2026)</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Carregue o pacote oficial com Sub-11 e Sub-12: clubes por grupo, times e todos os jogos.
          Use o JSON <code className="text-sm">basegol_paulista_import_2026.json</code> ou o script CLI com a pasta de CSVs.
        </p>
      </div>
      <PaulistaPackImportPanel />
    </div>
  );
}
