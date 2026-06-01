"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { parseApiResponse } from "@/lib/api-client";
import { useAdminOptions } from "@/hooks/use-admin-options";
import { TeamCrest } from "@/components/matches/TeamCrest";

type EnrolledTeam = {
  id: string;
  club: { id: string; name: string; crestUrl: string | null };
};

type Props = {
  groupId: string;
};

export function GroupTeamsField({ groupId }: Props) {
  const { options: clubs, loading: clubsLoading } = useAdminOptions("clubs");
  const [enrolled, setEnrolled] = useState<EnrolledTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [clubToAdd, setClubToAdd] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/groups/${groupId}/teams`);
      if (!res.ok) throw new Error();
      const data = await parseApiResponse<EnrolledTeam[]>(res);
      setEnrolled(Array.isArray(data) ? data : []);
    } catch {
      setEnrolled([]);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  const enrolledClubIds = new Set(enrolled.map((t) => t.club.id));
  const availableClubs = clubs.filter((c) => !enrolledClubIds.has(c.value));

  async function addClub() {
    if (!clubToAdd) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/groups/${groupId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId: clubToAdd }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error || "Erro ao inscrever");
      }
      setClubToAdd("");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao inscrever clube");
    } finally {
      setSaving(false);
    }
  }

  async function removeTeam(teamId: string, clubName: string, force = false) {
    const msg = force
      ? `Remover "${clubName}" e APAGAR todos os jogos deste clube neste grupo? Esta ação não pode ser desfeita.`
      : `Remover "${clubName}" deste grupo?`;
    if (!confirm(msg)) return;

    try {
      const qs = new URLSearchParams({ teamId });
      if (force) qs.set("force", "true");
      const res = await fetch(`/api/admin/groups/${groupId}/teams?${qs}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = (json as { error?: string }).error ?? "";
        if (res.status === 409 && err.includes("jogo(s)")) {
          const okForce = confirm(
            `${err}\n\nDeseja remover o clube e apagar esses jogos do grupo?`
          );
          if (okForce) return removeTeam(teamId, clubName, true);
          return;
        }
        throw new Error(err || "Não foi possível remover");
      }
      const data = json.data as { matchesDeleted?: number } | undefined;
      if (data?.matchesDeleted && data.matchesDeleted > 0) {
        alert(`Clube removido. ${data.matchesDeleted} jogo(s) do grupo foram excluídos.`);
      }
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Não foi possível remover o clube do grupo.");
    }
  }

  return (
    <div className="rounded-xl border border-line bg-graphite/40 p-4 space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">Clubes no grupo</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Inscreva os clubes que disputarão jogos neste grupo. Se o clube já tiver jogos importados,
          a remoção pode pedir confirmação para apagar esses jogos.
        </p>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Carregando equipes...</p>
      ) : enrolled.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum clube inscrito ainda.</p>
      ) : (
        <ul className="space-y-2 max-h-40 overflow-y-auto">
          {enrolled.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-2 rounded-lg border border-line bg-graphite-light px-3 py-2"
            >
              <TeamCrest url={t.club.crestUrl} name={t.club.name} size="sm" />
              <span className="flex-1 text-sm truncate">{t.club.name}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void removeTeam(t.id, t.club.name)}
              >
                Remover
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs text-muted-foreground block mb-1">Adicionar clube</label>
          <Select
            value={clubToAdd}
            onChange={(e) => setClubToAdd(e.target.value)}
            disabled={clubsLoading || availableClubs.length === 0}
          >
            <option value="">
              {availableClubs.length === 0 ? "Todos os clubes já inscritos" : "Selecione..."}
            </option>
            {availableClubs.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <Button type="button" onClick={() => void addClub()} disabled={!clubToAdd || saving}>
          Inscrever
        </Button>
      </div>
    </div>
  );
}
