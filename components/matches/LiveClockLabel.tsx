"use client";

import { useEffect, useMemo, useState } from "react";
import { formatLiveClock } from "@/lib/match-display";
import type { MatchWithTeams } from "@/types";

type Props = {
  match: Pick<
    MatchWithTeams,
    | "status"
    | "minute"
    | "matchPeriod"
    | "elapsedSeconds"
    | "clockRunning"
    | "clockStartedAt"
    | "periodLengthMin"
    | "periodCount"
  >;
  className?: string;
};

export function LiveClockLabel({ match, className }: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!match.clockRunning) return;
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [match.clockRunning, match.clockStartedAt, match.elapsedSeconds]);

  const label = useMemo(
    () => formatLiveClock(match.status, match.minute, match, now),
    [match, now]
  );

  return <span className={className}>{label}</span>;
}
