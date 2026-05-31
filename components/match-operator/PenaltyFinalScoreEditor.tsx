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
    <div className="mb-6 rounded-xl border border-line bg-pitch/30 p-4 sm:p-5 space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Disputa de pênaltis
        </p>
        <p className="text-xs text-muted-foreground">
          Informe o resultado (ex.: 5 × 6). O tempo regulamentar não é alterado.
        </p>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-center max-w-md sm:max-w-lg">
        <div className="flex flex-col items-center sm:items-start gap-2 min-w-0">
          <span
            className="font-display text-base sm:text-lg font-semibold tracking-wide text-foreground truncate max-w-full"
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
              "w-full max-w-[5rem] h-12 sm:h-14 text-center text-xl sm:text-2xl font-display font-semibold tabular-nums",
              "border-line bg-graphite-light"
            )}
            value={homeScore}
            onChange={(e) => onHomeChange(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>

        <div className="flex flex-col items-center justify-center px-1 pt-6 sm:pt-7">
          <span className="font-display text-2xl sm:text-3xl text-muted-foreground leading-none">
            ×
          </span>
        </div>

        <div className="flex flex-col items-center sm:items-end gap-2 min-w-0">
          <span
            className="font-display text-base sm:text-lg font-semibold tracking-wide text-foreground truncate max-w-full"
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
              "w-full max-w-[5rem] h-12 sm:h-14 text-center text-xl sm:text-2xl font-display font-semibold tabular-nums",
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
