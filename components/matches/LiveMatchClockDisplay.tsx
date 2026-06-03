"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildPublicMatchClockDisplay,
  formatLiveClockLines,
} from "@/lib/match-clock-display";
import { formatElapsedClock } from "@/lib/match-live";
import { resolveTotalPeriods } from "@/lib/match-phase";
import type { MatchWithTeams } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  match: Pick<
    MatchWithTeams,
    | "status"
    | "minute"
    | "matchPeriod"
    | "currentPhase"
    | "phaseDurationSeconds"
    | "phaseElapsedSeconds"
    | "phaseStartedAt"
    | "isClockRunning"
    | "periodsConfigured"
    | "matchPeriodLabel"
    | "showTotalGameTime"
    | "elapsedSeconds"
    | "accumulatedPeriodSeconds"
    | "clockRunning"
    | "clockStartedAt"
    | "periodLengthMin"
    | "totalPeriods"
    | "periodCount"
    | "periodsConfigured"
  >;
  size?: "sm" | "lg";
  className?: string;
};

export function LiveMatchClockDisplay({ match, size = "sm", className }: Props) {
  const [now, setNow] = useState(() => new Date());

  const running = match.isClockRunning ?? match.clockRunning ?? false;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [running, match.clockStartedAt, match.phaseStartedAt, match.elapsedSeconds]);

  const display = useMemo(() => {
    const fields = {
      status: match.status,
      currentPhase: match.currentPhase ?? undefined,
      matchPeriod: match.matchPeriod ?? "SCHEDULED",
      minute: match.minute ?? null,
      phaseDurationSeconds: match.phaseDurationSeconds,
      phaseElapsedSeconds: match.phaseElapsedSeconds,
      phaseStartedAt: match.phaseStartedAt ?? null,
      isClockRunning: running,
      periodsConfigured: match.periodsConfigured,
      matchPeriodLabel: match.matchPeriodLabel,
      showTotalGameTime: match.showTotalGameTime,
      elapsedSeconds: match.elapsedSeconds ?? match.phaseElapsedSeconds ?? 0,
      accumulatedPeriodSeconds: match.accumulatedPeriodSeconds ?? 0,
      clockRunning: running,
      clockStartedAt: match.phaseStartedAt ?? match.clockStartedAt ?? null,
      periodLengthMin: match.periodLengthMin ?? 17,
      periodCount: resolveTotalPeriods(match),
    };
    return {
      built: buildPublicMatchClockDisplay(fields, [], now),
      lines: formatLiveClockLines(fields, [], now),
    };
  }, [match, now]);

  const { built, lines } = display;
  const isLarge = size === "lg";

  if (!built.showCountdown) {
    return (
      <span
        className={cn(
          "font-medium text-white",
          isLarge ? "text-base" : "text-sm",
          className
        )}
      >
        {lines.primary}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 tabular-nums",
        isLarge ? "items-center text-center" : "items-end",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5",
          isLarge ? "justify-center" : "justify-end"
        )}
      >
        <span
          className="h-2 w-2 shrink-0 rounded-full bg-[#4ade80]"
          aria-hidden
        />
        <span
          className={cn(
            "font-semibold uppercase tracking-wider text-[#4ade80]",
            isLarge ? "text-sm" : "text-xs"
          )}
        >
          {lines.periodLabel}
        </span>
      </div>
      <span
        className={cn(
          "font-mono font-bold text-white",
          isLarge ? "text-4xl sm:text-5xl" : "text-xl sm:text-2xl"
        )}
        aria-label={`Tempo restante no período: ${formatElapsedClock(built.remainingSeconds)}`}
      >
        {lines.primary}
      </span>
      {lines.secondary ? (
        <span
          className={cn(
            "text-neutral-500",
            isLarge ? "text-sm" : "text-[11px]"
          )}
        >
          {lines.secondary}
        </span>
      ) : null}
      {built.isPaused ? (
        <span className="text-[10px] font-medium text-amber-400/90">
          Cronômetro pausado
        </span>
      ) : null}
    </div>
  );
}
