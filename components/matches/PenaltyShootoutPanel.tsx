"use client";

import {
  formatAttemptsSequence,
  type PenaltyAttemptChar,
} from "@/lib/match-penalties";
import { cn } from "@/lib/utils";

function AttemptSequence({
  attempts,
  label,
  align = "center",
}: {
  attempts: PenaltyAttemptChar[];
  label: string;
  align?: "left" | "center" | "right";
}) {
  return (
    <div
      className={cn(
        "min-w-0 flex-1",
        align === "left" && "text-left",
        align === "right" && "text-right",
        align === "center" && "text-center"
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate mb-1">
        {label}
      </p>
      <p
        className="font-mono text-sm sm:text-base tracking-[0.2em] text-foreground tabular-nums"
        aria-label={`Cobranças: ${formatAttemptsSequence(attempts)}`}
      >
        {attempts.length > 0 ? formatAttemptsSequence(attempts) : "—"}
      </p>
    </div>
  );
}

export function PenaltyShootoutPanel({
  homeScore,
  awayScore,
  homeLabel,
  awayLabel,
  homeAttempts = [],
  awayAttempts = [],
  homeKicks = [],
  awayKicks = [],
  className,
}: {
  homeScore: number;
  awayScore: number;
  homeLabel?: string;
  awayLabel?: string;
  homeAttempts?: PenaltyAttemptChar[];
  awayAttempts?: PenaltyAttemptChar[];
  homeKicks?: boolean[];
  awayKicks?: boolean[];
  className?: string;
}) {
  const homeSeq: PenaltyAttemptChar[] =
    homeAttempts.length > 0
      ? homeAttempts
      : homeKicks.map((k) => (k ? "O" : "X"));
  const awaySeq: PenaltyAttemptChar[] =
    awayAttempts.length > 0
      ? awayAttempts
      : awayKicks.map((k) => (k ? "O" : "X"));

  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-pitch/60 px-4 py-4 sm:px-6 sm:py-5 space-y-3",
        className
      )}
    >
      <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Disputa de pênaltis
      </p>
      <div className="flex items-center justify-center gap-3 sm:gap-6">
        <AttemptSequence
          attempts={homeSeq}
          label={homeLabel ?? "Mandante"}
          align="right"
        />
        <div className="shrink-0 text-center px-2">
          <p className="font-display text-3xl tabular-nums tracking-wide text-foreground sm:text-4xl">
            {homeScore}
            <span className="mx-1.5 text-muted-foreground">:</span>
            {awayScore}
          </p>
        </div>
        <AttemptSequence
          attempts={awaySeq}
          label={awayLabel ?? "Visitante"}
          align="left"
        />
      </div>
    </div>
  );
}
