"use client";

import Link from "next/link";
import { ChevronRight, X } from "lucide-react";
import { TeamCrest } from "@/components/matches/TeamCrest";
import type { FavoriteClub } from "@/hooks/use-club-favorites";
import { cn } from "@/lib/utils";

type Props = {
  club: FavoriteClub;
  onRemove: (clubId: string) => void | Promise<void>;
  removing?: boolean;
};

export function FavoriteClubCard({ club, onRemove, removing }: Props) {
  return (
    <article className="flex items-center gap-3 rounded-2xl border border-line bg-graphite-light p-4 sm:gap-4 sm:p-5">
      <Link
        href={`/clubes/${club.slug}`}
        className="group flex min-w-0 flex-1 items-center gap-3 sm:gap-4"
      >
        <TeamCrest url={club.crestUrl} name={club.name} size="lg" />
        <p className="min-w-0 flex-1 truncate font-display text-lg tracking-wide text-foreground sm:text-xl">
          {club.name}
        </p>
        <ChevronRight
          className="h-5 w-5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
          aria-hidden
        />
      </Link>

      <button
        type="button"
        onClick={() => void onRemove(club.id)}
        disabled={removing}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-2 text-xs font-medium",
          "text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-graphite hover:text-foreground",
          "disabled:pointer-events-none disabled:opacity-50"
        )}
        aria-label={`Remover ${club.name} dos favoritos`}
      >
        <X className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Remover</span>
      </button>
    </article>
  );
}
