"use client";

import { PenaltyShootoutPanel } from "@/components/matches/PenaltyShootoutPanel";
import { clubSigla } from "@/lib/club-display";
import type { PenaltyAttemptChar } from "@/lib/match-penalties";
import { parsePenaltyAttempts } from "@/lib/match-penalties";
import { cn } from "@/lib/utils";

type Props = {
  homeName: string;
  awayName: string;
  homeShortName?: string | null;
  awayShortName?: string | null;
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
  homeShortName,
  awayShortName,
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
  const homeSigla = clubSigla(homeShortName, homeName);
  const awaySigla = clubSigla(awayShortName, awayName);
  const winnerSigla =
    penaltyWinner === "home" ? homeSigla : penaltyWinner === "away" ? awaySigla : null;
  const winnerFullName =
    penaltyWinner === "home" ? homeName : penaltyWinner === "away" ? awayName : null;

  return (
    <div
      className={cn(
        isPublic ? "w-full space-y-4" : "space-y-3",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-col items-center gap-1 rounded-xl border border-line/60 bg-pitch/30 px-4 py-3",
          showPenalties && !isPublic && "pb-2"
        )}
      >
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
        <div className="space-y-2.5">
          <PenaltyShootoutPanel
            homeScore={penHome}
            awayScore={penAway}
            homeLabel={!isPublic ? homeSigla : homeName}
            awayLabel={!isPublic ? awaySigla : awayName}
            homeTitle={homeName}
            awayTitle={awayName}
            homeAttempts={homeSeq}
            awayAttempts={awaySeq}
            homeKicks={penaltyKicks?.home}
            awayKicks={penaltyKicks?.away}
            showTeamLabels={!isPublic}
            showKickSequence={showKickSequence}
            className={isPublic ? "max-w-lg mx-auto" : "w-full"}
          />
          {penaltyWinner && winnerSigla && layout !== "operator" ? (
            <p
              className="text-center text-sm font-semibold text-neon"
              title={winnerFullName ?? undefined}
            >
              Vencedor: {winnerSigla}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
