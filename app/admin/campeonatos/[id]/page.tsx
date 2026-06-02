import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CHAMPIONSHIP_STATUS_LABELS } from "@/lib/admin-labels";
import { formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import { buildChampionshipAdminNav } from "@/lib/championship-admin-nav";

type Props = { params: Promise<{ id: string }> };

export default async function ChampionshipAdminOverviewPage({ params }: Props) {
  const { id } = await params;
  const championship = await prisma.championship.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          categories: true,
          matches: true,
          news: true,
        },
      },
    },
  });
  if (!championship) notFound();

  const nav = buildChampionshipAdminNav(id).filter((n) => n.segment && n.segment !== "editar");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{championship.name}</h1>
        <p className="text-muted-foreground mt-1">
          Temporada {championship.season} ·{" "}
          {CHAMPIONSHIP_STATUS_LABELS[championship.status] ?? championship.status}
          {championship.startDate
            ? ` · Início ${formatDate(championship.startDate)}`
            : ""}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="glass-card p-4">
          <p className="text-2xl font-semibold tabular-nums">{championship._count.categories}</p>
          <p className="text-xs text-muted-foreground mt-1">Categorias</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-2xl font-semibold tabular-nums">{championship._count.matches}</p>
          <p className="text-xs text-muted-foreground mt-1">Jogos</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-2xl font-semibold tabular-nums">{championship._count.news}</p>
          <p className="text-xs text-muted-foreground mt-1">Notícias</p>
        </div>
      </div>

      <div className="glass-card divide-y divide-line/50">
        {nav.slice(1).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between px-4 py-3 text-sm hover:bg-graphite/40 transition-colors"
          >
            <span>{item.label}</span>
            <span className="text-muted-foreground">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
