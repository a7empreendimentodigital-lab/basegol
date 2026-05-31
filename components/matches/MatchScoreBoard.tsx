"use client";

import { PenaltyShootoutPanel } from "@/components/matches/PenaltyShootoutPanel";
import type { PenaltyAttemptChar } from "@/lib/match-penalties";
import { parsePenaltyAttempts } from "@/lib/match-penalties";
import { cn } from "@/lib/utils";

type Props = {
  homeName: string;
  awayName: string;
  homeScore: number;
  awayScore: number;
  homePenaltyScore?: number;
  awayPenaltyScore?: number;
  homePenaltyAttempts?: PenaltyAttemptChar[];
  awayPenaltyAttempts?: PenaltyAttemptChar[];
  penaltyKicks?: { home: boolean[]; away: boolean[] };
  showPenalties: boolean;
  penaltyWinner?: "home" | "away" | null;
  size?: "sm" | "lg";
  /** Público: pênaltis em faixa larga abaixo; operador: bloco compacto com nomes */
  layout?: "public" | "operator";
  className?: string;
};

export function MatchScoreBoard({
  homeName,
  awayName,
  homeScore,
  awayScore,
  homePenaltyScore = 0,
  awayPenaltyScore = 0,
  homePenaltyAttempts,
  awayPenaltyAttempts,
  penaltyKicks,
  showPenalties,
  penaltyWinner,
  size = "lg",
  layout = "operator",
  className,
}: Props) {
  const isLarge = size === "lg";
  const isPublic = layout === "public";

  const homeSeq =
    parsePenaltyAttempts(homePenaltyAttempts).length > 0
      ? parsePenaltyAttempts(homePenaltyAttempts)
      : (penaltyKicks?.home ?? []).map((k) => (k ? "O" : "X") as PenaltyAttemptChar);
  const awaySeq =
    parsePenaltyAttempts(awayPenaltyAttempts).length > 0
      ? parsePenaltyAttempts(awayPenaltyAttempts)
      : (penaltyKicks?.away ?? []).map((k) => (k ? "O" : "X") as PenaltyAttemptChar);

  const penHome = homePenaltyScore;
  const penAway = awayPenaltyScore;
  const showKickSequence = homeSeq.length > 0 || awaySeq.length > 0;

  return (
    <div
      className={cn(
        isPublic ? "w-full space-y-4" : "space-y-4",
        className
      )}
    >
      <div className="flex flex-col items-center gap-1">
        {showPenalties ? (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tempo regulamentar
          </p>
        ) : null}
        <p
          className={cn(
            "font-display tabular-nums tracking-wider text-foreground",
            isLarge ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"
          )}
        >
          {homeScore}
          <span className="mx-1 text-muted-foreground">:</span>
          {awayScore}
        </p>
      </div>

      {showPenalties ? (
        <>
          <PenaltyShootoutPanel
            homeScore={penHome}
            awayScore={penAway}
            homeLabel={homeName}
            awayLabel={awayName}
            homeAttempts={homeSeq}
            awayAttempts={awaySeq}
            homeKicks={penaltyKicks?.home}
            awayKicks={penaltyKicks?.away}
            showTeamLabels={!isPublic}
            showKickSequence={showKickSequence}
            className={isPublic ? "max-w-lg" : undefined}
          />
          {penaltyWinner ? (
            <p className="text-center text-sm font-medium text-neon">
              Vencedor: {penaltyWinner === "home" ? homeName : awayName}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
