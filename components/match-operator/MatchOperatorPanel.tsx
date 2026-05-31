"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CircleDot,
  Minus,
  Pause,
  Play,
  Plus,
  Square,
  Timer,
} from "lucide-react";
import { parseApiResponse } from "@/lib/api-client";
import { useToast } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  getOperatorPhaseActions,
  resolveCurrentPhase,
  resolveTotalPeriods,
} from "@/lib/match-phase";
import { LiveMatchClockDisplay } from "@/components/matches/LiveMatchClockDisplay";
import { MatchScoreBoard } from "@/components/matches/MatchScoreBoard";
import { MatchOperatorEventsSection } from "@/components/match-operator/MatchOperatorEventsSection";
import { PenaltyFinalScoreEditor } from "@/components/match-operator/PenaltyFinalScoreEditor";
import {
  formatOperatorEventMinutePreview,
  operatorPhaseLabelForMinute,
  resolveOperatorEventMinute,
} from "@/lib/match-event-minute";
import { cn } from "@/lib/utils";

export type MatchData = {
  id: string;
  status: string;
  matchPeriod?: string | null;
  currentPhase?: string | null;
  phaseDurationSeconds?: number;
  phaseElapsedSeconds?: number;
  phaseStartedAt?: string | null;
  isClockRunning?: boolean;
  periodsConfigured?: boolean;
  totalPeriods?: number;
  hasIntervals?: boolean;
  hasPenaltyShootout?: boolean;
  penaltyBonusPointsEnabled?: boolean;
  showTotalGameTime?: boolean;
  minute: number | null;
  elapsedSeconds?: number;
  accumulatedPeriodSeconds?: number;
  clockRunning?: boolean;
  clockStartedAt?: string | null;
  periodLengthMin?: number;
  periodCount?: number;
  homeScore: number;
  awayScore: number;
  homePenaltyScore?: number;
  awayPenaltyScore?: number;
  homePenaltyAttempts?: ("O" | "X")[];
  awayPenaltyAttempts?: ("O" | "X")[];
  penaltyKicks?: { home: boolean[]; away: boolean[] };
  penaltyAttempts?: { home: ("O" | "X")[]; away: ("O" | "X")[] };
  penaltyWinner?: "home" | "away" | null;
  inPenaltyShootout?: boolean;
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeam?: { id?: string; club: { name: string; shortName?: string | null } };
  awayTeam?: { id?: string; club: { name: string; shortName?: string | null } };
  events: {
    id: string;
    minute: number;
    extraMinute?: number | null;
    type: string;
    description?: string | null;
    athlete?: { firstName: string; lastName: string } | null;
  }[];
  statistics?: {
    homeShots: number;
    awayShots: number;
    homePossession: number;
    awayPossession: number;
    homeFouls: number;
    awayFouls: number;
    homeYellowCards: number;
    awayYellowCards: number;
    homeRedCards: number;
    awayRedCards: number;
  } | null;
};

type PanelMode = "placar" | "eventos" | "estatisticas" | "all";
type AthleteOption = { value: string; label: string };

function SectionCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-line bg-graphite-light overflow-hidden", className)}>
      <div className="px-4 py-3 border-b border-line">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {description ? <p className="text-xs text-muted-foreground mt-0.5">{description}</p> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function MatchOperatorPanel({ matchId, mode = "all" }: { matchId: string; mode?: PanelMode }) {
  const { toast } = useToast();
  const [match, setMatch] = useState<MatchData | null>(null);
  const [extraMinute, setExtraMinute] = useState(0);
  const [clockTick, setClockTick] = useState(0);
  const [loading, setLoading] = useState(false);
  const [athletes, setAthletes] = useState<AthleteOption[]>([]);
  const [eventSide, setEventSide] = useState<"home" | "away">("home");
  const [athleteId, setAthleteId] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [periodLengthMin, setPeriodLengthMin] = useState(17);
  const [totalPeriods, setTotalPeriods] = useState(2);
  const [hasIntervals, setHasIntervals] = useState(true);
  const [hasPenaltyShootout, setHasPenaltyShootout] = useState(false);
  const [penaltyBonusPointsEnabled, setPenaltyBonusPointsEnabled] = useState(false);
  const [penHomeInput, setPenHomeInput] = useState(0);
  const [penAwayInput, setPenAwayInput] = useState(0);
  /** Evita que o poll sobrescreva o formulário enquanto o operador edita. */
  const configFormDirty = useRef(false);

  const applyConfigFromMatch = useCallback((data: MatchData) => {
    if (data.periodLengthMin != null) setPeriodLengthMin(data.periodLengthMin);
    setTotalPeriods(resolveTotalPeriods(data));
    if (data.hasIntervals != null) setHasIntervals(data.hasIntervals);
    if (data.hasPenaltyShootout != null) setHasPenaltyShootout(data.hasPenaltyShootout);
    if (data.penaltyBonusPointsEnabled != null) {
      setPenaltyBonusPointsEnabled(data.penaltyBonusPointsEnabled);
    }
    setPenHomeInput(data.homePenaltyScore ?? 0);
    setPenAwayInput(data.awayPenaltyScore ?? 0);
  }, []);

  const loadAthletes = useCallback(
    async (side: "home" | "away") => {
      const res = await fetch(`/api/operator/matches/${matchId}/athletes?side=${side}`);
      if (!res.ok) {
        setAthletes([]);
        return;
      }
      const list = await parseApiResponse<{ id: string; label: string }[]>(res);
      setAthletes(
        Array.isArray(list) ? list.map((a) => ({ value: a.id, label: a.label })) : []
      );
    },
    [matchId]
  );

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/matches/${matchId}?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = await parseApiResponse<MatchData>(res);
    setMatch(data);
    if (data && !configFormDirty.current) {
      applyConfigFromMatch(data);
    }
  }, [matchId, applyConfigFromMatch]);

  useEffect(() => {
    void refresh();
    const ms = match?.isClockRunning || match?.clockRunning ? 1000 : 5000;
    const t = setInterval(() => void refresh(), ms);
    return () => clearInterval(t);
  }, [refresh, match?.isClockRunning, match?.clockRunning]);

  useEffect(() => {
    void loadAthletes(eventSide);
    setAthleteId("");
  }, [eventSide, loadAthletes]);

  const clockRunning = !!(match?.isClockRunning || match?.clockRunning);
  const inTimedPeriod =
    match != null &&
    resolveOperatorEventMinute(match) > 0 &&
    match.status === "LIVE";

  useEffect(() => {
    if (!clockRunning) return;
    const t = setInterval(() => setClockTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [clockRunning, match?.phaseStartedAt, match?.clockStartedAt]);

  const eventMinute = useMemo(() => {
    if (!match) return 0;
    void clockTick;
    return resolveOperatorEventMinute(match);
  }, [match, clockTick]);

  const eventMinutePreview = useMemo(() => {
    if (!match) return "—";
    return formatOperatorEventMinutePreview(
      eventMinute,
      extraMinute,
      operatorPhaseLabelForMinute(match)
    );
  }, [match, eventMinute, extraMinute]);

  async function action(actionName: string, extra?: object) {
    setLoading(true);
    try {
      const res = await fetch(`/api/operator/matches/${matchId}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionName,
          minute: eventMinute,
          extraMinute: extraMinute || undefined,
          side: eventSide,
          athleteId: athleteId || undefined,
          description: eventDescription || undefined,
          ...extra,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await parseApiResponse<MatchData>(res);
      setMatch(updated);
      if (updated) {
        setPenHomeInput(updated.homePenaltyScore ?? 0);
        setPenAwayInput(updated.awayPenaltyScore ?? 0);
      }
      if (actionName === "SET_MATCH_CONFIG" && updated) {
        applyConfigFromMatch(updated);
        configFormDirty.current = false;
      }
      setEventDescription("");
      toast({ title: "Partida atualizada", variant: "success" });
    } catch {
      toast({ title: "Erro ao atualizar partida", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  const stats = match?.statistics;
  const homeName = match?.homeTeam?.club.name ?? "Mandante";
  const awayName = match?.awayTeam?.club.name ?? "Visitante";
  const homeShortName = match?.homeTeam?.club.shortName ?? null;
  const awayShortName = match?.awayTeam?.club.shortName ?? null;
  const isLivePhase =
    match?.status === "LIVE" || match?.status === "HALFTIME";

  const showPenaltyScoreEditor =
    !!match &&
    (hasPenaltyShootout ||
      match.currentPhase === "PENALTIES" ||
      (match.homePenaltyScore ?? 0) + (match.awayPenaltyScore ?? 0) > 0);

  async function savePenaltyScore() {
    await action("SET_PENALTY_SCORE", {
      homePenaltyScore: penHomeInput,
      awayPenaltyScore: penAwayInput,
    });
  }

  const phaseDurationSeconds = periodLengthMin * 60;

  const configPayload = {
    totalPeriods,
    hasIntervals,
    hasPenaltyShootout,
    penaltyBonusPointsEnabled,
    phaseDurationSeconds,
    periodLengthMin,
  };

  const phaseActions = (match
    ? getOperatorPhaseActions({
        status: match.status,
        currentPhase: resolveCurrentPhase({
          status: match.status,
          currentPhase: match.currentPhase ?? "PRE_MATCH",
          phaseDurationSeconds: match.phaseDurationSeconds ?? phaseDurationSeconds,
          phaseElapsedSeconds: match.phaseElapsedSeconds ?? 0,
          phaseStartedAt: match.phaseStartedAt ?? null,
          isClockRunning: match.isClockRunning ?? match.clockRunning ?? false,
          periodsConfigured: match.periodsConfigured ?? false,
          totalPeriods,
          hasIntervals,
          hasPenaltyShootout,
          penaltyBonusPointsEnabled,
          matchPeriod: match.matchPeriod,
          periodLengthMin,
          periodCount: totalPeriods,
        }),
        phaseDurationSeconds: match.phaseDurationSeconds ?? phaseDurationSeconds,
        phaseElapsedSeconds: match.phaseElapsedSeconds ?? 0,
        phaseStartedAt: match.phaseStartedAt ?? null,
        isClockRunning: match.isClockRunning ?? match.clockRunning ?? false,
        periodsConfigured: match.periodsConfigured ?? false,
        totalPeriods,
        hasIntervals,
        hasPenaltyShootout,
        penaltyBonusPointsEnabled,
        matchPeriod: match.matchPeriod,
        periodLengthMin,
        periodCount: totalPeriods,
      })
    : []
  ).filter((a) => a.action !== "SET_MATCH_CONFIG");

  async function phaseAction(
    actionName: string,
    extra?: Record<string, unknown>
  ) {
    await action(actionName, {
      ...configPayload,
      ...extra,
    });
  }

  return (
    <div className="space-y-4">
      {(mode === "all" || mode === "placar") && (
        <SectionCard
          title="Controle da partida"
          description="Configure tempos e intervalos. Cada fase é iniciada e encerrada manualmente; o público vê só a fase atual e o cronômetro dela."
        >
          {match && isLivePhase ? (
            <div className="mb-5 flex justify-center">
              <LiveMatchClockDisplay match={match} size="lg" />
            </div>
          ) : null}
          {match ? (
            <div className="mb-5 rounded-2xl border border-line bg-pitch/25 p-4 sm:p-5">
              <MatchScoreBoard
                layout="operator"
                homeName={homeName}
                awayName={awayName}
                homeShortName={homeShortName}
                awayShortName={awayShortName}
                homeScore={match.homeScore}
                awayScore={match.awayScore}
                homePenaltyScore={match.homePenaltyScore}
                awayPenaltyScore={match.awayPenaltyScore}
                homePenaltyAttempts={
                  match.homePenaltyAttempts ?? match.penaltyAttempts?.home
                }
                awayPenaltyAttempts={
                  match.awayPenaltyAttempts ?? match.penaltyAttempts?.away
                }
                penaltyKicks={match.penaltyKicks}
                showPenalties={
                  !!match.inPenaltyShootout ||
                  match.hasPenaltyShootout === true ||
                  (match.homePenaltyScore ?? 0) + (match.awayPenaltyScore ?? 0) > 0
                }
                penaltyWinner={match.penaltyWinner}
                size="sm"
              />
            </div>
          ) : null}

          <div className="mb-6 rounded-xl border border-line bg-pitch/30 p-4 sm:p-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Configuração da partida
            </p>
            <div className="flex flex-wrap items-end justify-center gap-4 sm:justify-start sm:gap-6">
              <div className="text-center sm:text-left">
                <Label className="text-muted-foreground">Minutos por tempo</Label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  className="w-24 text-center text-lg font-semibold mt-1 tabular-nums"
                  value={periodLengthMin}
                  onChange={(e) => {
                    configFormDirty.current = true;
                    setPeriodLengthMin(Number(e.target.value));
                  }}
                />
              </div>
              <div className="text-center sm:text-left">
                <Label className="text-muted-foreground">Quantidade de tempos</Label>
                <Select
                  className="w-28 mt-1 text-center font-semibold"
                  value={String(totalPeriods)}
                  onChange={(e) => {
                    configFormDirty.current = true;
                    setTotalPeriods(Number(e.target.value));
                  }}
                >
                  <option value="2">2 tempos</option>
                  <option value="3">3 tempos</option>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm sm:justify-start">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasIntervals}
                  onChange={(e) => {
                    configFormDirty.current = true;
                    setHasIntervals(e.target.checked);
                  }}
                  className="rounded border-line"
                />
                Intervalo entre tempos
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPenaltyShootout}
                  onChange={(e) => {
                    configFormDirty.current = true;
                    setHasPenaltyShootout(e.target.checked);
                  }}
                  className="rounded border-line"
                />
                Disputa de pênaltis
              </label>
              {hasPenaltyShootout ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={penaltyBonusPointsEnabled}
                    onChange={(e) => {
                      configFormDirty.current = true;
                      setPenaltyBonusPointsEnabled(e.target.checked);
                    }}
                    className="rounded border-line"
                  />
                  Ponto bônus nos pênaltis
                </label>
              ) : null}
            </div>
            <div className="flex justify-center sm:justify-start">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => phaseAction("SET_MATCH_CONFIG")}
              >
                Salvar configuração
              </Button>
            </div>
          </div>

          {showPenaltyScoreEditor ? (
            <PenaltyFinalScoreEditor
              homeName={homeName}
              awayName={awayName}
              homeShortName={homeShortName}
              awayShortName={awayShortName}
              homeScore={penHomeInput}
              awayScore={penAwayInput}
              onHomeChange={setPenHomeInput}
              onAwayChange={setPenAwayInput}
              onSave={() => void savePenaltyScore()}
              loading={loading}
            />
          ) : null}

          <div className="mb-6 rounded-xl border border-line bg-pitch/30 p-4 sm:p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Minuto do evento
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Minuto (automático)</Label>
                <div
                  className="mt-1 flex h-12 items-center justify-center sm:justify-start sm:px-4 rounded-lg border border-line bg-graphite tabular-nums text-2xl font-display font-semibold text-foreground"
                  aria-live="polite"
                >
                  {inTimedPeriod || eventMinute > 0 ? eventMinute : "—"}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
                  Segue o cronômetro do tempo em andamento. Na linha do tempo e no público
                  aparece como no exemplo: 12+3&apos;.
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Acréscimo (manual)</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 shrink-0"
                    disabled={loading || extraMinute <= 0}
                    aria-label="Diminuir acréscimo"
                    onClick={() => setExtraMinute((v) => Math.max(0, v - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    inputMode="numeric"
                    className="h-12 flex-1 text-center text-xl font-display font-semibold tabular-nums"
                    value={extraMinute}
                    onChange={(e) =>
                      setExtraMinute(Math.min(30, Math.max(0, Number(e.target.value) || 0)))
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 shrink-0"
                    disabled={loading || extraMinute >= 30}
                    aria-label="Aumentar acréscimo"
                    onClick={() => setExtraMinute((v) => Math.min(30, v + 1))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
                  Ajuste antes de registrar gol, cartão ou falta. Zere após o lance se não houver
                  acréscimo.
                </p>
              </div>
            </div>
            <p className="text-sm rounded-lg bg-pitch/40 border border-line/80 px-3 py-2">
              <span className="text-muted-foreground">Próximo evento: </span>
              <span className="font-semibold text-neon tabular-nums">{eventMinutePreview}</span>
            </p>
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Fases do jogo (controle manual)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {phaseActions.map((pa) => (
              <Button
                key={`${pa.action}-${pa.label}`}
                disabled={loading}
                variant={pa.variant ?? "default"}
                className="h-11 justify-start"
                onClick={() =>
                  phaseAction(pa.action, {
                    targetPhase: pa.payload?.targetPhase,
                    startClock: pa.payload?.startClock,
                    phaseDurationSeconds:
                      (pa.payload?.phaseDurationSeconds as number | undefined) ??
                      phaseDurationSeconds,
                  })
                }
              >
                {pa.action === "GO_TO_PHASE" && pa.payload?.startClock ? (
                  <Play className="h-4 w-4 mr-2 shrink-0" />
                ) : pa.action === "PAUSE_CLOCK" ? (
                  <Pause className="h-4 w-4 mr-2 shrink-0" />
                ) : pa.action === "END_MATCH" ? (
                  <Square className="h-4 w-4 mr-2 shrink-0" />
                ) : pa.label.includes("pênalt") ? (
                  <CircleDot className="h-4 w-4 mr-2 shrink-0" />
                ) : pa.action === "RESUME_CLOCK" ? (
                  <Play className="h-4 w-4 mr-2 shrink-0" />
                ) : (
                  <Timer className="h-4 w-4 mr-2 shrink-0" />
                )}
                {pa.label}
              </Button>
            ))}
          </div>
        </SectionCard>
      )}

      {(mode === "all" || mode === "eventos") && match ? (
        <MatchOperatorEventsSection
          homeName={homeName}
          awayName={awayName}
          homeShortName={homeShortName}
          awayShortName={awayShortName}
          events={match.events}
          eventSide={eventSide}
          onEventSideChange={setEventSide}
          athleteId={athleteId}
          onAthleteIdChange={setAthleteId}
          athletes={athletes}
          eventDescription={eventDescription}
          onEventDescriptionChange={setEventDescription}
          loading={loading}
          onAction={(name) => void action(name)}
          eventsOnly={mode === "eventos"}
        />
      ) : null}

      {(mode === "all" || mode === "estatisticas") && (
        <SectionCard title="Estatísticas" description="Incremento rápido por time">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["homeShots", "awayShots", "Finalizações"],
                ["homePossession", "awayPossession", "Posse (%)"],
                ["homeFouls", "awayFouls", "Faltas"],
                ["homeYellowCards", "awayYellowCards", "Amarelos"],
                ["homeRedCards", "awayRedCards", "Vermelhos"],
              ] as const
            ).map(([homeKey, awayKey, label]) => (
              <div key={label} className="rounded-xl border border-line bg-pitch/30 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
                <p className="text-2xl font-display tabular-nums text-center mb-3">
                  {(stats?.[homeKey] as number) ?? 0}
                  <span className="text-muted-foreground mx-2">×</span>
                  {(stats?.[awayKey] as number) ?? 0}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loading}
                    className="text-xs h-8"
                    onClick={() =>
                      action("UPDATE_STATS", {
                        stats: {
                          ...stats,
                          [homeKey]: ((stats?.[homeKey] as number) ?? 0) + 1,
                          [awayKey]: (stats?.[awayKey] as number) ?? 0,
                        },
                      })
                    }
                  >
                    Casa +1
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loading}
                    className="text-xs h-8"
                    onClick={() =>
                      action("UPDATE_STATS", {
                        stats: {
                          ...stats,
                          [homeKey]: (stats?.[homeKey] as number) ?? 0,
                          [awayKey]: ((stats?.[awayKey] as number) ?? 0) + 1,
                        },
                      })
                    }
                  >
                    Fora +1
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
