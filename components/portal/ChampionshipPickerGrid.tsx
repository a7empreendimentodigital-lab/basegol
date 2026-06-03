"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
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
          const logoSrc = normalizeImageSrc(c.logoUrl);
          const subtitle = championshipSubtitle(c);

          return (
            <li key={c.slug}>
              <Link
                href={`/campeonatos/${c.slug}`}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#1c1c1c]/95 px-3.5 py-3.5 transition-colors active:bg-white/5"
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

      <div className="hidden gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {championships.map((c) => {
          const logoSrc = normalizeImageSrc(c.logoUrl);
          const subtitle = championshipSubtitle(c);

          return (
            <Link
              key={c.slug}
              href={`/campeonatos/${c.slug}`}
              className="group flex h-full flex-col items-start rounded-lg border border-white/10 bg-[#1a1a1a]/90 p-5 text-left transition-colors hover:border-white/20 hover:bg-[#222222]/95"
            >
              <ChampionshipLogo
                name={c.name}
                logoSrc={logoSrc}
                className="mb-4 h-16 w-16 justify-start"
              />
              <h2 className="font-display text-base font-semibold uppercase leading-snug tracking-wide text-white line-clamp-2">
                {c.name}
              </h2>
              <p className="mt-2 flex-1 text-xs leading-relaxed text-neutral-400 line-clamp-5">
                {subtitle}
              </p>
              <span className="mt-5 inline-flex w-full items-center justify-between gap-2 rounded-md border border-white/15 bg-black/30 px-3.5 py-2.5 text-sm font-medium text-white transition-colors group-hover:border-white/25 group-hover:bg-white/5">
                <span>Acessar campeonato</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
