import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function ChampionshipImportLogPage({ params }: Props) {
  const { id } = await params;
  const championship = await prisma.championship.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!championship) notFound();

  const imports = await prisma.scheduleImport.findMany({
    where: { championshipId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      category: { select: { name: true } },
      _count: { select: { logs: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Log de importação</h1>
        <p className="text-muted-foreground mt-1">
          Histórico de importações de agenda e pacotes para {championship.name}.
        </p>
      </div>

      {imports.length === 0 ? (
        <p className="glass-card p-8 text-center text-sm text-muted-foreground">
          Nenhuma importação registrada para este campeonato.
        </p>
      ) : (
        <div className="glass-card overflow-hidden divide-y divide-line/50">
          {imports.map((row) => (
            <div key={row.id} className="px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-foreground">{row.fileName}</p>
                <span className="text-xs text-muted-foreground">{row.status}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(row.createdAt)}
                {row.category ? ` · ${row.category.name}` : ""}
                {` · ${row._count.logs} registro(s) de log`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
