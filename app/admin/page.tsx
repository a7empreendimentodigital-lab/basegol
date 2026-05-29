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
} from "lucide-react";
import { parseApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type Stats = {
  clubs: number;
  athletes: number;
  matchesToday: number;
  championships: number;
  liveMatches: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    void fetch("/api/admin/dashboard")
      .then(async (r) => (r.ok ? parseApiResponse<Stats>(r) : null))
      .then(setStats);
  }, []);

  const cards = [
    {
      label: "Clubes aprovados",
      value: stats?.clubs,
      icon: Shield,
      href: "/admin/clubes",
      hint: "Gerenciar clubes",
    },
    {
      label: "Atletas cadastrados",
      value: stats?.athletes,
      icon: Users,
      href: "/admin/atletas",
      hint: "Elenco e fichas",
    },
    {
      label: "Jogos hoje",
      value: stats?.matchesToday,
      icon: Calendar,
      href: "/admin/jogos",
      hint: "Agenda do dia",
    },
    {
      label: "Campeonatos ativos",
      value: stats?.championships,
      icon: Trophy,
      href: "/admin/campeonatos",
      hint: "Competições",
    },
    {
      label: "Ao vivo agora",
      value: stats?.liveMatches,
      icon: Activity,
      href: "/admin/placar-ao-vivo",
      hint: "Operar partidas",
      highlight: (stats?.liveMatches ?? 0) > 0,
    },
  ];

  return (
    <div className="space-y-8 w-full">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">Painel administrativo</p>
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Visão geral do sistema. Acesse os módulos pelo menu à esquerda ou pelos atalhos abaixo.
        </p>
      </header>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {cards.map(({ label, value, icon: Icon, href, hint, highlight }) => (
          <Link
            key={label}
            href={href}
            className={cn(
              "group rounded-2xl border border-line bg-graphite-light p-5 transition-all",
              "hover:border-selected/40 hover:bg-graphite",
              highlight && "ring-1 ring-selected/30"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className={cn(
                  "rounded-xl p-2.5",
                  highlight ? "bg-red-500/15 text-red-400" : "bg-selected/15 text-selected"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              {highlight && (
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase text-red-400">
                  <Radio className="h-3 w-3" />
                  Live
                </span>
              )}
            </div>
            <p className="mt-4 text-3xl font-bold tabular-nums text-foreground">
              {value ?? "—"}
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">{label}</p>
            <p className="mt-2 text-xs text-muted-foreground group-hover:text-selected flex items-center gap-1 transition-colors">
              {hint}
              <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </p>
          </Link>
        ))}
      </div>

      <section className="rounded-2xl border border-line bg-graphite-light p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Ações rápidas</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Novo jogo", href: "/admin/jogos" },
            { label: "Placar ao vivo", href: "/admin/placar-ao-vivo" },
            { label: "Novo clube", href: "/admin/clubes" },
            { label: "Marca e identidade", href: "/admin/personalizacao" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center justify-between rounded-xl border border-line bg-pitch/50 px-4 py-3 text-sm font-medium hover:bg-graphite transition-colors"
            >
              {action.label}
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
