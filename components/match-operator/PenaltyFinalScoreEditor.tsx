"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  homeLabel: string;
  awayLabel: string;
  homeScore: number;
  awayScore: number;
  onHomeChange: (value: number) => void;
  onAwayChange: (value: number) => void;
  onSave: () => void;
  loading?: boolean;
};

export function PenaltyFinalScoreEditor({
  homeLabel,
  awayLabel,
  homeScore,
  awayScore,
  onHomeChange,
  onAwayChange,
  onSave,
  loading = false,
}: Props) {
  return (
    <div className="mb-6 rounded-xl border border-line bg-pitch/30 p-4 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
        Placar final — disputa de pênaltis
      </p>
      <p className="text-xs text-muted-foreground text-center max-w-md mx-auto">
        Informe o resultado da disputa (ex.: 5 x 6). O placar do tempo regulamentar não é alterado.
      </p>
      <div className="flex flex-wrap items-end justify-center gap-6">
        <div className="text-center">
          <Label className="text-muted-foreground">{homeLabel}</Label>
          <Input
            type="number"
            min={0}
            max={99}
            className="w-20 text-center text-lg font-semibold mt-1 tabular-nums"
            value={homeScore}
            onChange={(e) => onHomeChange(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
        <span className="pb-2 text-lg font-semibold text-muted-foreground">×</span>
        <div className="text-center">
          <Label className="text-muted-foreground">{awayLabel}</Label>
          <Input
            type="number"
            min={0}
            max={99}
            className="w-20 text-center text-lg font-semibold mt-1 tabular-nums"
            value={awayScore}
            onChange={(e) => onAwayChange(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
      </div>
      <div className="flex justify-center">
        <Button type="button" disabled={loading} onClick={onSave}>
          Salvar placar de pênaltis
        </Button>
      </div>
    </div>
  );
}
