import { cn } from "@/lib/utils";

type StatisticBarProps = {
  label: string;
  homeValue: number;
  awayValue: number;
};

export function StatisticBar({ label, homeValue, awayValue }: StatisticBarProps) {
  const total = homeValue + awayValue || 1;
  const homePct = Math.round((homeValue / total) * 100);
  const awayPct = 100 - homePct;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="font-mono font-semibold tabular-nums">{homeValue}</span>
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold tabular-nums">{awayValue}</span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("bg-foreground/70 transition-all duration-500")}
          style={{ width: `${homePct}%` }}
        />
        <div
          className="bg-muted-foreground/35 transition-all duration-500"
          style={{ width: `${awayPct}%` }}
        />
      </div>
    </div>
  );
}
