"use client";

import { parsePenaltyAttempts, type PenaltyAttemptChar } from "@/lib/match-penalties";
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
          ? `${attempts.filter((a) => a === "O").length} convertidos de ${attempts.length} cobranças`
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
  /** Bolinhas por cobrança — só para partidas com sequência legada no banco */
  showKickSequence = false,
  /** Nome completo para tooltip quando o rótulo visível é a sigla */
  homeTitle,
  awayTitle,
  className,
}: {
  homeScore: number;
  awayScore: number;
  homeLabel?: string;
  awayLabel?: string;
  homeTitle?: string;
  awayTitle?: string;
  homeAttempts?: PenaltyAttemptChar[] | unknown;
  awayAttempts?: PenaltyAttemptChar[] | unknown;
  homeKicks?: boolean[];
  awayKicks?: boolean[];
  /** Exibe nome do clube acima das bolinhas (ex.: painel do operador) */
  showTeamLabels?: boolean;
  showKickSequence?: boolean;
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

  /** Placar sempre do banco (homePenaltyScore / awayPenaltyScore), nunca recalculado na UI. */
  const displayHome = homeScore;
  const displayAway = awayScore;

  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-line bg-pitch/80 px-3 py-4 sm:px-5 sm:py-5",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 sm:gap-6 max-w-lg mx-auto">
        <div
          className={cn(
            "flex flex-col min-w-0 flex-1",
            showTeamLabels ? "items-center gap-1 sm:items-end sm:gap-1.5" : "items-end justify-center"
          )}
        >
          {showTeamLabels && homeLabel ? (
            <p
              className="font-display text-base sm:text-lg font-semibold tracking-wide text-foreground truncate max-w-full text-center sm:text-right"
              title={homeTitle ?? homeLabel}
            >
              {homeLabel}
            </p>
          ) : null}
          {showKickSequence ? <KickDots attempts={homeSeq} align="end" /> : null}
        </div>

        <div className="shrink-0 px-2 sm:px-5 text-center">
          <p className="font-display text-3xl sm:text-4xl tabular-nums tracking-wide text-foreground leading-none">
            {displayHome}
            <span className="mx-1.5 sm:mx-2 text-muted-foreground font-sans font-normal">:</span>
            {displayAway}
          </p>
          <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Pênaltis
          </p>
        </div>

        <div
          className={cn(
            "flex flex-col min-w-0 flex-1",
            showTeamLabels ? "items-center gap-1 sm:items-start sm:gap-1.5" : "items-start justify-center"
          )}
        >
          {showTeamLabels && awayLabel ? (
            <p
              className="font-display text-base sm:text-lg font-semibold tracking-wide text-foreground truncate max-w-full text-center sm:text-left"
              title={awayTitle ?? awayLabel}
            >
              {awayLabel}
            </p>
          ) : null}
          {showKickSequence ? <KickDots attempts={awaySeq} align="start" /> : null}
        </div>
      </div>
    </div>
  );
}
