"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CircleDot,
  Flag,
  Pause,
  Play,
  Square,
  Timer,
} from "lucide-react";
import { parseApiResponse } from "@/lib/api-client";
import { useToast } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MATCH_EVENT_LABELS } from "@/lib/admin-labels";
import { formatPublicLiveClock } from "@/lib/match-live";
import { cn } from "@/lib/utils";

export type MatchData = {
  id: string;
  status: string;
  matchPeriod?: string | null;
  minute: number | null;
  elapsedSeconds?: number;
  clockRunning?: boolean;
  periodLengthMin?: number;
  periodCount?: number;
  homeScore: number;
  awayScore: number;
  homePenaltyScore?: number;
  awayPenaltyScore?: number;
  inPenaltyShootout?: boolean;
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeam?: { id?: string; club: { name: string } };
  awayTeam?: { id?: string; club: { name: string } };
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
  const [minute, setMinute] = useState(0);
  const [extraMinute, setExtraMinute] = useState(0);
  const [loading, setLoading] = useState(false);
  const [athletes, setAthletes] = useState<AthleteOption[]>([]);
  const [eventSide, setEventSide] = useState<"home" | "away">("home");
  const [athleteId, setAthleteId] = useState("");
  const [eventDescription, setEventDescription] = useState("");

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
    const res = await fetch(`/api/matches/${matchId}`);
    if (!res.ok) return;
    const data = await parseApiResponse<MatchData>(res);
    setMatch(data);
    if (data?.minute != null) setMinute(data.minute);
  }, [matchId]);

  useEffect(() => {
    void refresh();
    const ms = match?.clockRunning ? 1000 : 5000;
    const t = setInterval(() => void refresh(), ms);
    return () => clearInterval(t);
  }, [refresh, match?.clockRunning]);

  useEffect(() => {
    void loadAthletes(eventSide);
    setAthleteId("");
  }, [eventSide, loadAthletes]);

  async function action(actionName: string, extra?: object) {
    setLoading(true);
    try {
      const res = await fetch(`/api/operator/matches/${matchId}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionName,
          minute,
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
      setMinute(updated?.minute ?? minute);
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
  const liveClockLabel =
    match && (match.status === "LIVE" || match.status === "HALFTIME")
      ? formatPublicLiveClock(
          {
            status: match.status,
            matchPeriod: match.matchPeriod ?? "SCHEDULED",
            minute: match.minute,
            elapsedSeconds: match.elapsedSeconds ?? 0,
            clockRunning: match.clockRunning ?? false,
            clockStartedAt: null,
            periodLengthMin: match.periodLengthMin ?? 17,
            periodCount: match.periodCount ?? 3,
          },
          match.events ?? []
        )
      : null;

  return (
    <div className="space-y-4">
      {(mode === "all" || mode === "placar") && (
        <SectionCard
          title="Controle da partida"
          description="O cronômetro roda automaticamente (3×17 min). Intervalo pausa; 2º e 3º tempo retomam de onde parou."
        >
          {liveClockLabel ? (
            <p className="mb-4 text-center font-mono text-lg font-semibold text-neon tabular-nums">
              {liveClockLabel}
            </p>
          ) : null}
          {match?.inPenaltyShootout ? (
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Tempo regulamentar: {match.homeScore} × {match.awayScore} · Pênaltis:{" "}
              {match.homePenaltyScore ?? 0} × {match.awayPenaltyScore ?? 0}
            </p>
          ) : null}
          <div className="flex flex-wrap items-end justify-center gap-6 mb-6">
            <div className="text-center">
              <Label className="text-muted-foreground">Minuto</Label>
              <Input
                type="number"
                min={0}
                max={130}
                className="w-24 text-center text-lg font-semibold mt-1 tabular-nums"
                value={minute}
                onChange={(e) => setMinute(Number(e.target.value))}
              />
            </div>
            <div className="text-center">
              <Label className="text-muted-foreground">Acréscimo</Label>
              <Input
                type="number"
                min={0}
                max={30}
                className="w-24 text-center text-lg font-semibold mt-1 tabular-nums"
                value={extraMinute}
                onChange={(e) => setExtraMinute(Number(e.target.value))}
              />
            </div>
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Fluxo do jogo
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Button disabled={loading} onClick={() => action("START_MATCH")} className="h-11">
              <Play className="h-4 w-4 mr-2" />
              Iniciar
            </Button>
            <Button disabled={loading} variant="outline" onClick={() => action("HALFTIME")} className="h-11">
              <Pause className="h-4 w-4 mr-2" />
              Intervalo
            </Button>
            <Button disabled={loading} variant="outline" onClick={() => action("SECOND_HALF")} className="h-11">
              <Timer className="h-4 w-4 mr-2" />
              2º tempo
            </Button>
            <Button disabled={loading} variant="outline" onClick={() => action("THIRD_HALF")} className="h-11">
              <Timer className="h-4 w-4 mr-2" />
              3º tempo
            </Button>
            <Button disabled={loading} variant="outline" onClick={() => action("PENALTY_SHOOTOUT")} className="h-11">
              <CircleDot className="h-4 w-4 mr-2" />
              Pênaltis
            </Button>
            <Button disabled={loading} variant="destructive" onClick={() => action("END_MATCH")} className="h-11">
              <Square className="h-4 w-4 mr-2" />
              Encerrar
            </Button>
          </div>
        </SectionCard>
      )}

      {(mode === "all" || mode === "eventos") && (
        <div className="grid gap-4 xl:grid-cols-2">
          <SectionCard
            title="Registrar evento"
            description={`${homeName} ou ${awayName} — use a escalação para filtrar atletas`}
          >
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Time</Label>
                  <Select
                    value={eventSide}
                    onChange={(e) => setEventSide(e.target.value as "home" | "away")}
                    className="mt-1"
                  >
                    <option value="home">{homeName}</option>
                    <option value="away">{awayName}</option>
                  </Select>
                </div>
                <div>
                  <Label>Atleta</Label>
                  <Select
                    value={athleteId}
                    onChange={(e) => setAthleteId(e.target.value)}
                    className="mt-1"
                    disabled={athletes.length === 0}
                  >
                    <option value="">
                      {athletes.length === 0 ? "Sem atletas na escalação" : "Selecione…"}
                    </option>
                    {athletes.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div>
                <Label>Descrição (substituição: Saiu: … | Entrou: …)</Label>
                <Textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="mt-1"
                  rows={2}
                  placeholder="Ex.: Saiu: 8 João | Entrou: 5 Pedro"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button disabled={loading} onClick={() => action("GOAL")} className="bg-neon hover:bg-neon/90 text-background">
                  <Flag className="h-4 w-4 mr-1" />
                  Gol
                </Button>
                <Button disabled={loading} variant="outline" onClick={() => action("YELLOW_CARD")}>
                  Amarelo
                </Button>
                <Button disabled={loading} variant="outline" onClick={() => action("RED_CARD")}>
                  Vermelho
                </Button>
                <Button disabled={loading} variant="outline" onClick={() => action("SUBSTITUTION")}>
                  Substituição
                </Button>
                <Button disabled={loading} variant="outline" onClick={() => action("PENALTY_GOAL")}>
                  Pênalti ✓
                </Button>
                <Button disabled={loading} variant="outline" onClick={() => action("PENALTY_MISS")}>
                  Pênalti ✕
                </Button>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Linha do tempo" description="Últimos eventos registrados">
            <div className="space-y-1 max-h-[420px] overflow-y-auto">
              {match?.events?.length ? (
                [...match.events].reverse().map((event) => (
                  <div
                    key={event.id}
                    className="flex gap-3 rounded-lg px-3 py-2.5 hover:bg-pitch/40 transition-colors"
                  >
                    <span className="shrink-0 w-12 text-sm font-bold text-neon tabular-nums">
                      {event.minute}
                      {event.extraMinute ? `+${event.extraMinute}` : ""}&apos;
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {MATCH_EVENT_LABELS[event.type] ?? event.type.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {event.description ??
                          (event.athlete
                            ? `${event.athlete.firstName} ${event.athlete.lastName}`
                            : "—")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Nenhum evento ainda. Inicie a partida e registre gols ou cartões.
                </p>
              )}
            </div>
          </SectionCard>
        </div>
      )}

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
