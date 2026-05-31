"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clubSigla } from "@/lib/club-display";
import { cn } from "@/lib/utils";

type Props = {
  homeName: string;
  awayName: string;
  homeShortName?: string | null;
  awayShortName?: string | null;
  homeScore: number;
  awayScore: number;
  onHomeChange: (value: number) => void;
  onAwayChange: (value: number) => void;
  onSave: () => void;
  loading?: boolean;
};

export function PenaltyFinalScoreEditor({
  homeName,
  awayName,
  homeShortName,
  awayShortName,
  homeScore,
  awayScore,
  onHomeChange,
  onAwayChange,
  onSave,
  loading = false,
}: Props) {
  const homeSigla = clubSigla(homeShortName, homeName);
  const awaySigla = clubSigla(awayShortName, awayName);

  return (
    <div className="mb-4 rounded-xl border border-line bg-pitch/30 p-3 sm:p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Pênaltis
      </p>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-6 items-end w-full">
        <div className="flex flex-col items-center gap-2 min-w-0">
          <span
            className="font-display text-base sm:text-lg font-semibold tracking-wide text-foreground truncate max-w-full text-center"
            title={homeName}
          >
            {homeSigla}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Mandante
          </span>
          <Input
            type="number"
            min={0}
            max={99}
            aria-label={`Pênaltis ${homeSigla}`}
            className={cn(
              "w-full max-w-[5.5rem] h-10 sm:h-11 text-center text-lg sm:text-xl font-display font-semibold tabular-nums",
              "border-line bg-graphite-light"
            )}
            value={homeScore}
            onChange={(e) => onHomeChange(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>

        <div className="flex items-center justify-center px-1 pb-3 sm:pb-4">
          <span className="font-display text-2xl sm:text-3xl text-muted-foreground leading-none">
            ×
          </span>
        </div>

        <div className="flex flex-col items-center gap-2 min-w-0">
          <span
            className="font-display text-base sm:text-lg font-semibold tracking-wide text-foreground truncate max-w-full text-center"
            title={awayName}
          >
            {awaySigla}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Visitante
          </span>
          <Input
            type="number"
            min={0}
            max={99}
            aria-label={`Pênaltis ${awaySigla}`}
            className={cn(
              "w-full max-w-[5.5rem] h-10 sm:h-11 text-center text-lg sm:text-xl font-display font-semibold tabular-nums",
              "border-line bg-graphite-light"
            )}
            value={awayScore}
            onChange={(e) => onAwayChange(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
      </div>

      <div className="flex justify-center sm:justify-start">
        <Button type="button" variant="outline" disabled={loading} onClick={onSave}>
          Salvar placar de pênaltis
        </Button>
      </div>
    </div>
  );
}
