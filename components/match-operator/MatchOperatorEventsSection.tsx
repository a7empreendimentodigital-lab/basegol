"use client";

import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MATCH_EVENT_LABELS } from "@/lib/admin-labels";
import { cn } from "@/lib/utils";

type EventRow = {
  id: string;
  minute: number;
  extraMinute?: number | null;
  type: string;
  description?: string | null;
  athlete?: { firstName: string; lastName: string } | null;
};

type Props = {
  homeName: string;
  awayName: string;
  events: EventRow[];
  eventSide: "home" | "away";
  onEventSideChange: (side: "home" | "away") => void;
  athleteId: string;
  onAthleteIdChange: (id: string) => void;
  athletes: { value: string; label: string }[];
  eventDescription: string;
  onEventDescriptionChange: (value: string) => void;
  loading: boolean;
  onAction: (actionName: string) => void;
  /** Aba dedicada “Eventos” — layout mobile-first */
  eventsOnly?: boolean;
};

function shortLabel(name: string, max = 16) {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

function SectionCard({
  title,
  description,
  children,
  compact,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-line bg-graphite-light overflow-hidden">
      <div className={cn("border-b border-line", compact ? "px-3 py-2.5" : "px-4 py-3")}>
        <h3 className="font-semibold text-foreground text-sm sm:text-base">{title}</h3>
        {description ? (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
        ) : null}
      </div>
      <div className={cn(compact ? "p-3" : "p-4")}>{children}</div>
    </section>
  );
}

function TeamSideToggle({
  homeName,
  awayName,
  value,
  onChange,
  large,
}: {
  homeName: string;
  awayName: string;
  value: "home" | "away";
  onChange: (side: "home" | "away") => void;
  large?: boolean;
}) {
  return (
    <div
      className={cn("grid grid-cols-2 gap-2", large && "gap-2.5")}
      role="group"
      aria-label="Selecionar time"
    >
      {(
        [
          ["home", homeName] as const,
          ["away", awayName] as const,
        ]
      ).map(([side, name]) => {
        const active = value === side;
        return (
          <button
            key={side}
            type="button"
            onClick={() => onChange(side)}
            className={cn(
              "rounded-xl border text-left transition-colors touch-manipulation",
              large ? "min-h-[3.25rem] px-3 py-2.5" : "min-h-11 px-3 py-2",
              active
                ? "border-neon bg-neon/15 text-foreground ring-2 ring-neon/50"
                : "border-line bg-pitch/40 text-muted-foreground hover:bg-pitch/60 hover:text-foreground"
            )}
          >
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {side === "home" ? "Mandante" : "Visitante"}
            </span>
            <span className={cn("block font-medium leading-snug", large ? "text-sm" : "text-xs")}>
              {shortLabel(name, large ? 22 : 18)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function MatchOperatorEventsSection({
  homeName,
  awayName,
  events,
  eventSide,
  onEventSideChange,
  athleteId,
  onAthleteIdChange,
  athletes,
  eventDescription,
  onEventDescriptionChange,
  loading,
  onAction,
  eventsOnly = false,
}: Props) {
  const actionBtn = cn(
    "touch-manipulation font-semibold",
    eventsOnly ? "min-h-[3.25rem] text-base sm:min-h-10 sm:text-sm" : ""
  );

  return (
    <div
      className={cn(
        "grid gap-4",
        eventsOnly ? "grid-cols-1 w-full max-w-lg mx-auto pb-safe" : "xl:grid-cols-2"
      )}
    >
      <SectionCard
        compact={eventsOnly}
        title="Registrar evento"
        description={
          eventsOnly
            ? "Escolha o time e toque no botão do evento"
            : `${homeName} ou ${awayName} — use a escalação para filtrar atletas`
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Time</Label>
            <div className={eventsOnly ? "block" : "sm:hidden"}>
              <TeamSideToggle
                homeName={homeName}
                awayName={awayName}
                value={eventSide}
                onChange={onEventSideChange}
                large={eventsOnly}
              />
            </div>
            {!eventsOnly ? (
              <div className="hidden sm:block">
                <Select
                  value={eventSide}
                  onChange={(e) => onEventSideChange(e.target.value as "home" | "away")}
                >
                  <option value="home">{homeName}</option>
                  <option value="away">{awayName}</option>
                </Select>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Button
              disabled={loading}
              onClick={() => onAction("GOAL")}
              className={cn(
                actionBtn,
                "bg-neon hover:bg-neon/90 text-background h-auto py-3.5 col-span-2"
              )}
            >
              <Flag className="h-5 w-5 mr-2 shrink-0" aria-hidden />
              Gol
            </Button>
            <Button
              disabled={loading}
              variant="outline"
              onClick={() => onAction("YELLOW_CARD")}
              className={cn(actionBtn, "h-auto py-3.5 border-amber-500/40 hover:bg-amber-500/10")}
            >
              Cartão amarelo
            </Button>
            <Button
              disabled={loading}
              variant="outline"
              onClick={() => onAction("RED_CARD")}
              className={cn(actionBtn, "h-auto py-3.5 border-red-500/40 hover:bg-red-500/10")}
            >
              Cartão vermelho
            </Button>
            <Button
              disabled={loading}
              variant="outline"
              onClick={() => onAction("SUBSTITUTION")}
              className={cn(actionBtn, "h-auto py-3.5 col-span-2")}
            >
              Substituição
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Atleta (opcional)</Label>
            <Select
              value={athleteId}
              onChange={(e) => onAthleteIdChange(e.target.value)}
              className={cn(eventsOnly && "h-12 text-base")}
              disabled={athletes.length === 0}
            >
              <option value="">
                {athletes.length === 0 ? "Sem atletas na escalação" : "Selecione o atleta…"}
              </option>
              {athletes.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </Select>
          </div>

          {eventsOnly ? (
            <details className="rounded-xl border border-line bg-pitch/30 group">
              <summary className="cursor-pointer list-none px-3 py-3 text-sm font-medium text-foreground touch-manipulation [&::-webkit-details-marker]:hidden">
                <span className="text-muted-foreground group-open:hidden">
                  + Descrição (substituição, observação)
                </span>
                <span className="hidden group-open:inline">Descrição do evento</span>
              </summary>
              <div className="px-3 pb-3 pt-0">
                <Textarea
                  value={eventDescription}
                  onChange={(e) => onEventDescriptionChange(e.target.value)}
                  rows={2}
                  className="text-base"
                  placeholder="Ex.: Saiu: 8 João | Entrou: 5 Pedro"
                />
              </div>
            </details>
          ) : (
            <div>
              <Label>Descrição (substituição: Saiu: … | Entrou: …)</Label>
              <Textarea
                value={eventDescription}
                onChange={(e) => onEventDescriptionChange(e.target.value)}
                className="mt-1"
                rows={2}
                placeholder="Ex.: Saiu: 8 João | Entrou: 5 Pedro"
              />
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        compact={eventsOnly}
        title="Linha do tempo"
        description="Últimos eventos registrados"
      >
        <div
          className={cn(
            "space-y-1 overflow-y-auto overscroll-contain -mx-1 px-1",
            eventsOnly
              ? "max-h-[min(55dvh,24rem)] sm:max-h-[420px]"
              : "max-h-[420px]"
          )}
        >
          {events.length ? (
            [...events].reverse().map((event) => (
              <div
                key={event.id}
                className={cn(
                  "flex gap-3 rounded-xl transition-colors",
                  eventsOnly ? "px-2 py-3 active:bg-pitch/50" : "rounded-lg px-3 py-2.5 hover:bg-pitch/40"
                )}
              >
                <span
                  className={cn(
                    "shrink-0 font-bold text-neon tabular-nums",
                    eventsOnly ? "w-11 text-base" : "w-12 text-sm"
                  )}
                >
                  {event.minute}
                  {event.extraMinute ? `+${event.extraMinute}` : ""}&apos;
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("font-medium", eventsOnly ? "text-sm sm:text-base" : "text-sm")}>
                    {MATCH_EVENT_LABELS[event.type] ?? event.type.replace(/_/g, " ")}
                  </p>
                  <p
                    className={cn(
                      "text-muted-foreground mt-0.5",
                      eventsOnly ? "text-xs sm:text-sm line-clamp-3" : "text-xs truncate"
                    )}
                  >
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
              Nenhum evento ainda. Registre gols ou cartões acima.
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
