"use client";

import {
  countConvertedAttempts,
  parsePenaltyAttempts,
  type PenaltyAttemptChar,
} from "@/lib/match-penalties";
import { cn } from "@/lib/utils";

function KickDots({ attempts }: { attempts: PenaltyAttemptChar[] }) {
  if (attempts.length === 0) {
    return (
      <div className="flex justify-center gap-1.5 min-h-[14px]">
        <span className="h-3.5 w-3.5 rounded-full bg-muted-foreground/20" aria-hidden />
      </div>
    );
  }

  return (
    <div
      className="flex flex-wrap justify-center gap-1.5 max-w-[11rem]"
      role="list"
      aria-label={`${attempts.filter((a) => a === "O").length} convertidos de ${attempts.length} cobranças`}
    >
      {attempts.map((kick, i) => (
        <span
          key={i}
          role="listitem"
          title={kick === "O" ? "Convertido" : "Perdido"}
          className={cn(
            "h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full border-2 shrink-0",
            kick === "O"
              ? "border-emerald-500 bg-emerald-500"
              : "border-red-500 bg-transparent"
          )}
          aria-label={kick === "O" ? "Pênalti convertido" : "Pênalti perdido"}
        />
      ))}
    </div>
  );
}

function SideKicks({
  attempts,
  label,
  align,
}: {
  attempts: PenaltyAttemptChar[];
  label: string;
  align: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 min-w-0 flex-1",
        align === "right" ? "items-end" : "items-start"
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate max-w-full">
        {label}
      </p>
      <KickDots attempts={attempts} />
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
        "rounded-2xl border border-line bg-pitch/60 px-4 py-4 sm:px-6 sm:py-5 space-y-3",
        className
      )}
    >
      <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Disputa de pênaltis
      </p>
      <div className="flex items-center justify-center gap-3 sm:gap-5">
        <SideKicks attempts={homeSeq} label={homeLabel ?? "Mandante"} align="right" />
        <div className="shrink-0 text-center px-1 sm:px-2">
          <p className="font-display text-3xl tabular-nums tracking-wide text-foreground sm:text-4xl">
            {displayHome}
            <span className="mx-1.5 text-muted-foreground">:</span>
            {displayAway}
          </p>
        </div>
        <SideKicks attempts={awaySeq} label={awayLabel ?? "Visitante"} align="left" />
      </div>
    </div>
  );
}
