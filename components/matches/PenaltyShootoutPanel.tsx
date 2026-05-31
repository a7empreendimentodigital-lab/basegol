"use client";

import {
  countConvertedAttempts,
  parsePenaltyAttempts,
  type PenaltyAttemptChar,
} from "@/lib/match-penalties";
import { cn } from "@/lib/utils";

function KickDots({
  attempts,
  align = "center",
}: {
  attempts: PenaltyAttemptChar[];
  align?: "start" | "center" | "end";
}) {
  return (
    <div
      className={cn(
        "flex flex-nowrap items-center gap-1 sm:gap-1.5 min-w-0",
        align === "end" && "justify-end",
        align === "start" && "justify-start",
        align === "center" && "justify-center"
      )}
      role="list"
      aria-label={
        attempts.length > 0
          ? `${countConvertedAttempts(attempts)} convertidos de ${attempts.length} cobranças`
          : "Sem cobranças"
      }
    >
      {attempts.length === 0 ? (
        <span
          className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-muted-foreground/20 shrink-0"
          aria-hidden
        />
      ) : (
        attempts.map((kick, i) => (
          <span
            key={i}
            role="listitem"
            className={cn(
              "h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full shrink-0",
              kick === "O" ? "bg-emerald-500" : "bg-red-500"
            )}
            aria-label={kick === "O" ? "Convertido" : "Perdido"}
          />
        ))
      )}
    </div>
  );
}

export function PenaltyShootoutPanel({
  homeScore,
  awayScore,
  homeLabel,
  awayLabel,
  homeAttempts,
  awayAttempts,
  homeKicks = [],
  awayKicks = [],
  showTeamLabels = false,
  className,
}: {
  homeScore: number;
  awayScore: number;
  homeLabel?: string;
  awayLabel?: string;
  homeAttempts?: PenaltyAttemptChar[] | unknown;
  awayAttempts?: PenaltyAttemptChar[] | unknown;
  homeKicks?: boolean[];
  awayKicks?: boolean[];
  /** Exibe nome do clube acima das bolinhas (ex.: painel do operador) */
  showTeamLabels?: boolean;
  className?: string;
}) {
  const homeSeq: PenaltyAttemptChar[] = (() => {
    const parsed = parsePenaltyAttempts(homeAttempts);
    if (parsed.length > 0) return parsed;
    return homeKicks.map((k) => (k ? "O" : "X") as PenaltyAttemptChar);
  })();

  const awaySeq: PenaltyAttemptChar[] = (() => {
    const parsed = parsePenaltyAttempts(awayAttempts);
    if (parsed.length > 0) return parsed;
    return awayKicks.map((k) => (k ? "O" : "X") as PenaltyAttemptChar);
  })();

  const displayHome =
    homeSeq.length > 0 ? countConvertedAttempts(homeSeq) : homeScore;
  const displayAway =
    awaySeq.length > 0 ? countConvertedAttempts(awaySeq) : awayScore;

  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-line bg-pitch/80 px-3 py-4 sm:px-5 sm:py-5",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-md mx-auto">
        <div
          className={cn(
            "flex flex-col min-w-0 flex-1",
            showTeamLabels ? "items-start gap-1.5" : "items-end justify-center"
          )}
        >
          {showTeamLabels && homeLabel ? (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate max-w-full">
              {homeLabel}
            </p>
          ) : null}
          <KickDots attempts={homeSeq} align="end" />
        </div>

        <div className="shrink-0 px-2 sm:px-4 text-center">
          <p className="font-display text-2xl sm:text-3xl tabular-nums tracking-wide text-foreground leading-none">
            {displayHome}
            <span className="mx-1 sm:mx-1.5 text-muted-foreground font-sans">:</span>
            {displayAway}
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Pen.
          </p>
        </div>

        <div
          className={cn(
            "flex flex-col min-w-0 flex-1",
            showTeamLabels ? "items-end gap-1.5" : "items-start justify-center"
          )}
        >
          {showTeamLabels && awayLabel ? (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate max-w-full text-right">
              {awayLabel}
            </p>
          ) : null}
          <KickDots attempts={awaySeq} align="start" />
        </div>
      </div>
    </div>
  );
}
