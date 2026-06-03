"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { isPaulistaPremiumChampionship } from "@/lib/portal-routes";
import { normalizeImageSrc } from "@/lib/image-url";
import { cn } from "@/lib/utils";

export type ChampionshipPickerItem = {
  slug: string;
  name: string;
  season: string;
  logoUrl: string | null;
  description?: string | null;
};

type Props = {
  championships: ChampionshipPickerItem[];
};

function championshipSubtitle(c: ChampionshipPickerItem): string {
  const desc = c.description?.trim();
  if (desc) return desc;
  return `Temporada ${c.season}`;
}

function ChampionshipLogo({
  name,
  logoSrc,
  className,
}: {
  name: string;
  logoSrc: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden",
        className
      )}
    >
      {logoSrc ? (
        <SafeImage
          src={logoSrc}
          alt=""
          width={96}
          height={96}
          className="h-full w-full object-contain"
        />
      ) : (
        <span className="font-display text-lg text-muted-foreground">
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

export function ChampionshipPickerGrid({ championships }: Props) {
  if (championships.length === 0) {
    return (
      <p className="rounded-xl border border-line/60 bg-graphite/30 px-6 py-12 text-center text-sm text-muted-foreground">
        Nenhum campeonato disponível no momento. Novos campeonatos aparecerão aqui quando
        forem publicados.
      </p>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3 sm:hidden">
        {championships.map((c) => {
          const premium = isPaulistaPremiumChampionship(c.slug, c.name);
          const logoSrc = normalizeImageSrc(c.logoUrl);
          const subtitle = championshipSubtitle(c);

          return (
            <li key={c.slug}>
              <Link
                href={`/campeonatos/${c.slug}`}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3.5 py-3.5 transition-colors active:bg-white/5",
                  premium
                    ? "border-[#22c55e]/35 bg-[#1a1f1c]/90"
                    : "border-white/10 bg-[#1c1c1c]/95"
                )}
              >
                <ChampionshipLogo
                  name={c.name}
                  logoSrc={logoSrc}
                  className="h-12 w-12"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-snug text-white">
                    {c.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-neutral-400">{subtitle}</p>
                </div>
                <ChevronRight
                  className="h-5 w-5 shrink-0 text-neutral-500"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {championships.map((c) => {
          const premium = isPaulistaPremiumChampionship(c.slug, c.name);
          const logoSrc = normalizeImageSrc(c.logoUrl);

          return (
            <Link
              key={c.slug}
              href={`/campeonatos/${c.slug}`}
              className={cn(
                "group flex flex-col items-center rounded-2xl border p-6 text-center transition-all",
                premium
                  ? "border-primary/40 bg-gradient-to-b from-primary/10 to-graphite/50 shadow-[0_0_40px_rgba(34,197,94,0.12)] hover:border-primary/70 hover:shadow-[0_0_48px_rgba(34,197,94,0.18)]"
                  : "border-line/60 bg-graphite/40 hover:border-line hover:bg-graphite/60"
              )}
            >
              <ChampionshipLogo
                name={c.name}
                logoSrc={logoSrc}
                className={cn("mb-4 h-20 w-20", premium && "h-24 w-24")}
              />
              <h2 className="font-display text-lg tracking-wide text-foreground line-clamp-2">
                {c.name}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {championshipSubtitle(c)}
              </p>
              <span
                className={cn(
                  "mt-5 inline-flex w-full items-center justify-center gap-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  premium
                    ? "border-primary/30 bg-pitch/60 group-hover:bg-primary/10 group-hover:text-primary"
                    : "border-line bg-pitch/40 group-hover:bg-graphite-light"
                )}
              >
                Acessar campeonato
                <ChevronRight className="h-4 w-4 opacity-70" aria-hidden />
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
