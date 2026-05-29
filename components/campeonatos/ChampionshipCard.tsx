import Image from "next/image";
import Link from "next/link";
import { Calendar, ChevronRight, Trophy } from "lucide-react";
import { CHAMPIONSHIP_STATUS_LABELS } from "@/lib/admin-labels";

export type ChampionshipCardProps = {
  slug: string;
  name: string;
  season: string;
  status: string;
  logoUrl?: string | null;
  description?: string | null;
};

export function ChampionshipCard({
  slug,
  name,
  season,
  status,
  logoUrl,
  description,
}: ChampionshipCardProps) {
  const statusLabel = CHAMPIONSHIP_STATUS_LABELS[status] ?? status;

  return (
    <Link
      href={`/campeonatos/${slug}`}
      className="group flex w-full items-center gap-4 sm:gap-5 rounded-2xl border border-line bg-graphite-light p-4 sm:p-5 hover:bg-graphite/90 transition-colors"
    >
      <div className="flex h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] shrink-0 items-center justify-center">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt=""
            width={72}
            height={72}
            className="h-full w-full object-contain"
            unoptimized={logoUrl.startsWith("/uploads/")}
          />
        ) : (
          <Trophy
            className="h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground/90"
            strokeWidth={1.25}
            aria-hidden
          />
        )}
      </div>

      <div className="flex-1 min-w-0 py-0.5">
        <h2 className="font-display text-xl sm:text-2xl tracking-wide text-foreground leading-tight line-clamp-2">
          {name}
        </h2>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
          <span>Temporada {season}</span>
        </p>
        {description ? (
          <p className="mt-2 text-xs text-muted-foreground/90 line-clamp-2 hidden sm:block">
            {description}
          </p>
        ) : null}
        <span className="inline-block mt-2.5 text-[11px] font-medium text-muted-foreground border border-line rounded-md bg-pitch/40 px-2.5 py-0.5">
          {statusLabel}
        </span>
      </div>

      <ChevronRight
        className="h-5 w-5 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
        aria-hidden
      />
    </Link>
  );
}
