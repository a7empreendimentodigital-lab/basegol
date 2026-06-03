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

export function ChampionshipPickerList({ championships }: Props) {
  if (championships.length === 0) {
    return (
      <p className="rounded-lg border border-white/10 bg-[#1c1c1c]/95 px-6 py-12 text-center text-sm text-neutral-400">
        Nenhum campeonato disponível no momento. Novos campeonatos aparecerão aqui quando
        forem publicados.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {championships.map((c) => {
        const logoSrc = normalizeImageSrc(c.logoUrl);
        const subtitle = championshipSubtitle(c);

        return (
          <li key={c.slug}>
            <Link
              href={`/campeonatos/${c.slug}`}
              className="flex items-center gap-3.5 rounded-lg border border-white/10 bg-[#1c1c1c]/95 px-4 py-4 transition-colors hover:border-white/20 hover:bg-[#242424]/95 active:bg-white/5 sm:gap-4 sm:px-5 sm:py-4"
            >
              <ChampionshipLogo
                name={c.name}
                logoSrc={logoSrc}
                className="h-12 w-12 sm:h-14 sm:w-14"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug text-white sm:text-base">
                  {c.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-neutral-400 sm:text-sm">
                  {subtitle}
                </p>
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
  );
}

/** @deprecated Use ChampionshipPickerList */
export function ChampionshipPickerGrid(props: Props) {
  return <ChampionshipPickerList {...props} />;
}
