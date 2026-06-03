"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  buildChampionshipAdminNav,
  isChampionshipAdminNavActive,
} from "@/lib/championship-admin-nav";
import { cn } from "@/lib/utils";

type Props = {
  championshipId: string;
  championshipName: string;
  userRole?: string;
  children: React.ReactNode;
};

export function ChampionshipAdminShell({
  championshipId,
  championshipName,
  userRole,
  children,
}: Props) {
  const pathname = usePathname() ?? "";
  const isChampionshipOnlyAdmin = userRole === "ADMIN_CAMPEONATO";
  const nav = buildChampionshipAdminNav(championshipId).filter((item) => {
    if (!isChampionshipOnlyAdmin) return true;
    if (item.segment === "importar" || item.segment === "importacao-log") return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <aside className="lg:w-56 shrink-0">
        {!isChampionshipOnlyAdmin ? (
          <Link
            href="/admin/campeonatos"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Todos os campeonatos
          </Link>
        ) : null}
        <p className="font-display text-lg tracking-wide text-foreground line-clamp-2">
          {championshipName}
        </p>
        <nav className="mt-4 flex flex-col gap-0.5" aria-label="Administração do campeonato">
          {nav.map((item) => {
            const active = isChampionshipAdminNavActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-muted-foreground hover:bg-graphite/60 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
