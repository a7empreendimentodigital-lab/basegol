import { MapPin } from "lucide-react";
import { formatRoundLabel } from "@/lib/match-display";
import { formatDate, formatTime } from "@/lib/utils";
import type { MatchWithTeams } from "@/types";

type Props = {
  match: Pick<
    MatchWithTeams,
    "scheduledAt" | "championshipName" | "categoryName" | "round" | "venue"
  >;
};

/** Bloco de meta do jogo (mesmo visual dos cards de Hoje/Próximos). */
export function MatchDetailMeta({ match }: Props) {
  return (
    <div className="mt-4 w-full max-w-lg mx-auto rounded-lg border border-line/50 bg-[#141414] px-4 py-3 text-left sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {match.categoryName ? (
            <p className="font-display text-lg font-bold uppercase leading-none tracking-wide text-foreground sm:text-xl">
              {match.categoryName}
            </p>
          ) : null}
          {match.championshipName ? (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{match.championshipName}</p>
          ) : null}
        </div>

        <div className="shrink-0 text-right text-xs leading-snug text-muted-foreground">
          <p className="whitespace-nowrap">
            {formatDate(match.scheduledAt, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          {match.round != null ? (
            <p className="mt-0.5 whitespace-nowrap"># {formatRoundLabel(match.round)}</p>
          ) : null}
        </div>
      </div>

      {(match.venue || match.scheduledAt) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line/40 pt-3">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#2a2a2a] px-2.5 py-1 text-xs font-semibold tabular-nums text-foreground">
            {formatTime(match.scheduledAt)}
          </span>
          {match.venue ? (
            <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
              <span className="line-clamp-2">{match.venue}</span>
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
