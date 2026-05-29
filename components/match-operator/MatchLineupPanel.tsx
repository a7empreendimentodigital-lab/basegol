"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { parseApiResponse } from "@/lib/api-client";
import { useToast } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type LineupBoard = {
  matchId: string;
  home: TeamSide;
  away: TeamSide;
};

type TeamSide = {
  teamId: string;
  clubName: string;
  entries: {
    id: string;
    athleteId: string;
    name: string;
    role: "STARTER" | "SUBSTITUTE";
    shirtNumber: number | null;
    photoUrl: string | null;
  }[];
  availableAthletes: { id: string; label: string; shirtNumber: number | null }[];
};

type LocalEntry = {
  athleteId: string;
  role: "STARTER" | "SUBSTITUTE";
};

function TeamLineupEditor({
  side,
  team,
  onSave,
  saving,
}: {
  side: "home" | "away";
  team: TeamSide;
  onSave: (side: "home" | "away", entries: LocalEntry[]) => Promise<void>;
  saving: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(team.entries.map((e) => e.athleteId)));
  const [roles, setRoles] = useState<Record<string, "STARTER" | "SUBSTITUTE">>(() =>
    Object.fromEntries(team.entries.map((e) => [e.athleteId, e.role]))
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSelected(new Set(team.entries.map((e) => e.athleteId)));
    setRoles(Object.fromEntries(team.entries.map((e) => [e.athleteId, e.role])));
  }, [team.entries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return team.availableAthletes;
    return team.availableAthletes.filter((a) => a.label.toLowerCase().includes(q));
  }, [team.availableAthletes, search]);

  const starterCount = Array.from(selected).filter((id) => (roles[id] ?? "STARTER") === "STARTER").length;

  function toggle(athleteId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(athleteId)) {
        next.delete(athleteId);
      } else {
        next.add(athleteId);
        if (!roles[athleteId]) setRoles((r) => ({ ...r, [athleteId]: "STARTER" }));
      }
      return next;
    });
  }

  function selectAllStarters() {
    const ids = team.availableAthletes.map((a) => a.id);
    setSelected(new Set(ids));
    setRoles(Object.fromEntries(ids.map((id) => [id, "STARTER"])));
  }

  function clearAll() {
    setSelected(new Set());
  }

  return (
    <section className="rounded-2xl border border-line bg-graphite-light overflow-hidden flex flex-col min-h-[480px]">
      <div className="px-4 py-3 border-b border-line bg-pitch/20 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{team.clubName}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {selected.size} na escalação · {starterCount} titular
              {starterCount !== 1 ? "es" : ""}
            </p>
          </div>
          <Button
            size="sm"
            disabled={saving || team.availableAthletes.length === 0}
            onClick={() =>
              void onSave(
                side,
                Array.from(selected).map((athleteId) => ({
                  athleteId,
                  role: roles[athleteId] ?? "STARTER",
                }))
              )
            }
          >
            Salvar
          </Button>
        </div>

        {team.availableAthletes.length > 0 ? (
          <>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar atleta…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={selectAllStarters}>
                Marcar todos (titular)
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={clearAll}>
                Limpar
              </Button>
            </div>
          </>
        ) : null}
      </div>

      {team.availableAthletes.length === 0 ? (
        <div className="p-6 text-center flex-1 flex flex-col justify-center">
          <p className="text-sm text-muted-foreground mb-3">
            Nenhum atleta ativo neste clube.
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/atletas">Cadastrar atletas</Link>
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-line flex-1 overflow-y-auto max-h-[520px]">
          {filtered.map((a) => {
            const inLineup = selected.has(a.id);
            const num = a.shirtNumber;
            return (
              <li
                key={a.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 transition-colors",
                  inLineup && "bg-neon/5"
                )}
              >
                <input
                  type="checkbox"
                  checked={inLineup}
                  onChange={() => toggle(a.id)}
                  className="h-4 w-4 rounded border-line accent-neon shrink-0"
                  id={`${side}-${a.id}`}
                />
                <span
                  className={cn(
                    "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold tabular-nums",
                    inLineup ? "bg-neon/20 text-neon" : "bg-pitch text-muted-foreground"
                  )}
                >
                  {num ?? "—"}
                </span>
                <label htmlFor={`${side}-${a.id}`} className="flex-1 text-sm cursor-pointer min-w-0">
                  <span className="font-medium truncate block leading-snug">
                    {a.label.replace(/\s*\(#\d+\)\s*$/, "")}
                  </span>
                </label>
                {inLineup ? (
                  <Select
                    value={roles[a.id] ?? "STARTER"}
                    onChange={(e) =>
                      setRoles((r) => ({
                        ...r,
                        [a.id]: e.target.value as "STARTER" | "SUBSTITUTE",
                      }))
                    }
                    className="w-[108px] h-8 text-xs shrink-0"
                  >
                    <option value="STARTER">Titular</option>
                    <option value="SUBSTITUTE">Reserva</option>
                  </Select>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function MatchLineupPanel({ matchId }: { matchId: string }) {
  const { toast } = useToast();
  const [board, setBoard] = useState<LineupBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/operator/matches/${matchId}/lineup`);
      if (!res.ok) throw new Error();
      const data = await parseApiResponse<LineupBoard>(res);
      setBoard(data);
    } catch {
      toast({ title: "Não foi possível carregar a escalação", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [matchId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveSide(side: "home" | "away", entries: LocalEntry[]) {
    setSaving(true);
    try {
      const res = await fetch(`/api/operator/matches/${matchId}/lineup`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ side, entries }),
      });
      if (!res.ok) throw new Error();
      const updated = await parseApiResponse<LineupBoard>(res);
      setBoard(updated);
      toast({ title: "Escalação salva", variant: "success" });
    } catch {
      toast({ title: "Erro ao salvar escalação", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-96 rounded-2xl border border-line bg-graphite-light animate-pulse" />
        <div className="h-96 rounded-2xl border border-line bg-graphite-light animate-pulse" />
      </div>
    );
  }

  if (!board) {
    return <p className="text-sm text-muted-foreground">Partida não encontrada.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-neon/30 bg-neon/5 px-4 py-3 text-sm">
        <p className="text-foreground">
          <strong>1.</strong> Marque os atletas de cada time e salve.{" "}
          <strong>2.</strong> Em <strong>Eventos</strong>, só aparecem os escalados (ou todos, se vazio).{" "}
          <strong>3.</strong> A <strong>Súmula</strong> usa esta lista.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TeamLineupEditor side="home" team={board.home} onSave={saveSide} saving={saving} />
        <TeamLineupEditor side="away" team={board.away} onSave={saveSide} saving={saving} />
      </div>
    </div>
  );
}
