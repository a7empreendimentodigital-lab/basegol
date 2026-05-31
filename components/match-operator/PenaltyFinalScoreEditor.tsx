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
    <div className="mb-6 rounded-2xl border border-neon/20 bg-gradient-to-b from-neon/5 to-pitch/40 p-4 sm:p-5 space-y-4">
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-neon">
          Placar final — disputa de pênaltis
        </p>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Informe o resultado (ex.: 5 × 6). O tempo regulamentar não é alterado.
        </p>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-center max-w-md mx-auto">
        <div className="flex flex-col items-center gap-2 min-w-0">
          <span
            className="font-display text-lg sm:text-xl font-semibold tracking-wide text-foreground truncate max-w-full"
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
              "w-full max-w-[5rem] h-14 text-center text-2xl font-display font-semibold tabular-nums",
              "border-line bg-graphite-light focus-visible:ring-neon/40"
            )}
            value={homeScore}
            onChange={(e) => onHomeChange(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>

        <div className="flex flex-col items-center justify-center px-1 pt-6 sm:pt-7">
          <span className="font-display text-3xl sm:text-4xl text-muted-foreground leading-none">
            ×
          </span>
        </div>

        <div className="flex flex-col items-center gap-2 min-w-0">
          <span
            className="font-display text-lg sm:text-xl font-semibold tracking-wide text-foreground truncate max-w-full"
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
              "w-full max-w-[5rem] h-14 text-center text-2xl font-display font-semibold tabular-nums",
              "border-line bg-graphite-light focus-visible:ring-neon/40"
            )}
            value={awayScore}
            onChange={(e) => onAwayChange(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
      </div>

      <div className="flex justify-center pt-1">
        <Button
          type="button"
          disabled={loading}
          onClick={onSave}
          className="min-w-[12rem] bg-neon hover:bg-neon/90 text-background font-semibold"
        >
          Salvar placar de pênaltis
        </Button>
      </div>
    </div>
  );
}
