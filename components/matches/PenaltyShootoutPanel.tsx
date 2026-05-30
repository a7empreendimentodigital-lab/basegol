"use client";

import { cn } from "@/lib/utils";

function KickDots({ kicks }: { kicks: boolean[] }) {
  const slots = kicks.length >= 5 ? kicks : [...kicks, ...Array(Math.max(0, 5 - kicks.length)).fill(null)];
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {slots.map((scored, i) => (
        <span
          key={i}
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            scored === true && "bg-emerald-500",
            scored === false && "bg-red-500",
            scored == null && "bg-muted-foreground/25"
          )}
          aria-hidden
        />
      ))}
    </div>
  );
}

export function PenaltyShootoutPanel({
  homeScore,
  awayScore,
  homeKicks = [],
  awayKicks = [],
}: {
  homeScore: number;
  awayScore: number;
  homeKicks?: boolean[];
  awayKicks?: boolean[];
}) {
  return (
    <div className="rounded-2xl border border-line bg-pitch/60 px-4 py-5 sm:px-6">
      <div className="flex items-center justify-center gap-4 sm:gap-8">
        <KickDots kicks={homeKicks} />
        <div className="text-center">
          <p className="font-display text-3xl tabular-nums tracking-wide text-foreground sm:text-4xl">
            {homeScore}
            <span className="mx-2 text-muted-foreground">:</span>
            {awayScore}
          </p>
          <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Pen.
          </p>
        </div>
        <KickDots kicks={awayKicks} />
      </div>
    </div>
  );
}
