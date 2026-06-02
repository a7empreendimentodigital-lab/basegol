import Link from "next/link";
import { FileUp } from "lucide-react";

type Props = { params: Promise<{ id: string }> };

const IMPORT_LINKS = [
  { href: "/admin/importacao-paulista", label: "Pacote Paulista FPF", desc: "Clubes, grupos e jogos oficiais" },
  { href: "/admin/importacao-tabela", label: "Tabela PDF", desc: "Classificação por rodada" },
  { href: "/admin/importacao-jogos", label: "Jogos (agenda)", desc: "Importar partidas da agenda" },
  { href: "/admin/importacao-atletas", label: "Atletas CSV", desc: "Elenco por clube" },
  { href: "/admin/importacao-resultados", label: "Resultados", desc: "Placares e rodadas" },
] as const;

export default async function ChampionshipAdminImportPage({ params }: Props) {
  await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Importar dados</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Ferramentas de importação do sistema. Confirme o campeonato correto antes de importar.
        </p>
      </div>
      <ul className="glass-card divide-y divide-line/50">
        {IMPORT_LINKS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-start gap-3 px-4 py-4 hover:bg-graphite/40 transition-colors"
            >
              <FileUp className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
