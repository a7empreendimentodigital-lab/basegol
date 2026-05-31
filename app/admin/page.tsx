"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Shield,
  Trophy,
  Users,
  Activity,
  ArrowRight,
  Radio,
  LayoutGrid,
} from "lucide-react";
import { parseApiResponse } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Stats = {
  clubs: number;
  athletes: number;
  matchesToday: number;
  championships: number;
  liveMatches: number;
};

type StatCard = {
  label: string;
  value: number | undefined;
  icon: typeof Shield;
  href: string;
  hint: string;
  highlight?: boolean;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/admin/dashboard")
      .then(async (r) => (r.ok ? parseApiResponse<Stats>(r) : null))
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const cards: StatCard[] = [
    {
      label: "Clubes",
      value: stats?.clubs,
      icon: Shield,
      href: "/admin/clubes",
      hint: "Gerenciar",
    },
    {
      label: "Atletas",
      value: stats?.athletes,
      icon: Users,
      href: "/admin/atletas",
      hint: "Elenco",
    },
    {
      label: "Jogos hoje",
      value: stats?.matchesToday,
      icon: Calendar,
      href: "/admin/jogos",
      hint: "Agenda",
    },
    {
      label: "Campeonatos",
      value: stats?.championships,
      icon: Trophy,
      href: "/admin/campeonatos",
      hint: "Competições",
    },
    {
      label: "Ao vivo",
      value: stats?.liveMatches,
      icon: Activity,
      href: "/admin/placar-ao-vivo",
      hint: "Operar",
      highlight: (stats?.liveMatches ?? 0) > 0,
    },
  ];

  const quickActions = [
    { label: "Placar ao vivo", href: "/admin/placar-ao-vivo", primary: true },
    { label: "Novo jogo", href: "/admin/jogos" },
    { label: "Novo clube", href: "/admin/clubes" },
    { label: "Personalização", href: "/admin/personalizacao" },
  ];

  return (
    <div className="space-y-6 md:space-y-8 w-full">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Painel administrativo
        </p>
        <h1 className="font-display text-2xl sm:text-3xl tracking-wide text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
          Resumo do sistema. Use os atalhos abaixo ou o menu para acessar cada módulo.
        </p>
      </header>

      {(stats?.liveMatches ?? 0) > 0 ? (
        <Link
          href="/admin/placar-ao-vivo"
          className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3.5 transition-colors hover:bg-red-500/15"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-red-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-400" />
            </span>
            {stats!.liveMatches} partida{stats!.liveMatches === 1 ? "" : "s"} ao vivo agora
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-red-300" aria-hidden />
        </Link>
      ) : null}

      <section aria-labelledby="dashboard-stats">
        <h2 id="dashboard-stats" className="sr-only">
          Indicadores
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
          {cards.map(({ label, value, icon: Icon, href, hint, highlight }) => (
            <Link
              key={label}
              href={href}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-line bg-graphite-light p-3.5 sm:p-4 transition-all",
                "hover:border-neon/30 hover:bg-graphite active:scale-[0.98]",
                highlight && "col-span-2 sm:col-span-1 border-red-500/35 bg-red-500/[0.06] hover:border-red-500/50"
              )}
            >
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={cn(
                        "rounded-lg p-2",
                        highlight ? "bg-red-500/15 text-red-400" : "bg-neon/10 text-neon"
                      )}
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                    </div>
                    {highlight ? (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold uppercase text-red-400">
                        <Radio className="h-2.5 w-2.5" />
                        Live
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 font-display text-2xl sm:text-3xl tabular-nums text-foreground leading-none">
                    {value ?? "—"}
                  </p>
                  <p className="mt-1 text-xs sm:text-sm font-medium text-foreground">{label}</p>
                  <p className="mt-1.5 text-[10px] sm:text-xs text-muted-foreground group-hover:text-neon flex items-center gap-1 transition-colors">
                    {hint}
                    <ArrowRight className="h-3 w-3 opacity-60 group-hover:opacity-100" aria-hidden />
                  </p>
                </>
              )}
            </Link>
          ))}
        </div>
      </section>

      <section
        className="rounded-2xl border border-line bg-graphite-light p-4 sm:p-6"
        aria-labelledby="dashboard-quick"
      >
        <div className="flex items-center gap-2 mb-4">
          <LayoutGrid className="h-4 w-4 text-neon shrink-0" aria-hidden />
          <h2 id="dashboard-quick" className="text-sm font-semibold text-foreground">
            Ações rápidas
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "flex items-center justify-between gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-colors min-h-[3rem]",
                action.primary
                  ? "border-neon/40 bg-neon/10 text-foreground hover:bg-neon/15 col-span-2 sm:col-span-1"
                  : "border-line bg-pitch/40 text-foreground hover:bg-graphite"
              )}
            >
              <span className="leading-tight">{action.label}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
