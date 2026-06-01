"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { MatchesImportPreview } from "@/services/schedule-import/schedule-matches-import.service";
import type { ScheduleImportSummary } from "@/services/schedule-import/schedule-import.service";

type Option = { value: string; label: string };

type ImportResult = {
  importId: string;
  summary: ScheduleImportSummary;
  preview: MatchesImportPreview;
};

const STATUS_LABEL: Record<string, string> = {
  create: "Será criado",
  update: "Será atualizado",
  skip_duplicate: "Ignorado (já existe)",
  skip_filtered: "Ignorado (filtro)",
  error: "Erro",
};

export function ScheduleMatchesImportPanel() {
  const [championships, setChampionships] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [groups, setGroups] = useState<Option[]>([]);
  const [championshipId, setChampionshipId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [roundNumber, setRoundNumber] = useState("");
  const [groupName, setGroupName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<MatchesImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/options/championships")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setChampionships(j.data);
      });
  }, []);

  useEffect(() => {
    if (!championshipId) {
      setCategories([]);
      setCategoryId("");
      return;
    }
    fetch(`/api/admin/options/categories?championshipId=${championshipId}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          const all = j.data as Option[];
          const paulista = all.filter((c) =>
            /sub[-\s]?1[12]/i.test(c.label)
          );
          setCategories(paulista.length > 0 ? paulista : all);
        }
      });
  }, [championshipId]);

  useEffect(() => {
    if (!categoryId) {
      setGroups([]);
      setGroupName("");
      return;
    }
    fetch(`/api/admin/options/groups?categoryId=${categoryId}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setGroups(j.data);
      });
  }, [categoryId]);

  const buildFormData = useCallback(
    (action: "preview" | "import") => {
      const fd = new FormData();
      fd.append("action", action);
      if (file) fd.append("file", file);
      fd.append("championshipId", championshipId);
      if (categoryId) fd.append("categoryId", categoryId);
      if (roundNumber) fd.append("roundNumber", roundNumber);
      if (groupName) fd.append("groupName", groupName);
      return fd;
    },
    [file, championshipId, categoryId, roundNumber, groupName]
  );

  const onPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setPreview(null);
    if (!file || !championshipId) {
      setError("Selecione campeonato e PDF.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/import/schedule-matches", {
        method: "POST",
        body: buildFormData("preview"),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Falha na prévia");
        return;
      }
      setPreview(json.data);
    } catch {
      setError("Erro de rede ao gerar prévia.");
    } finally {
      setLoading(false);
    }
  };

  const onConfirmImport = async () => {
    if (!file || !championshipId || !preview) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/import/schedule-matches", {
        method: "POST",
        body: buildFormData("import"),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Falha na importação");
        return;
      }
      setResult(json.data);
      setPreview(null);
    } catch {
      setError("Erro de rede ao importar.");
    } finally {
      setLoading(false);
    }
  };

  const s = result?.summary;

  return (
    <div className="space-y-8">
      <form
        onSubmit={onPreview}
        className="rounded-xl border border-border bg-card p-6 space-y-4 max-w-xl"
      >
        <div>
          <label className="text-sm font-medium text-foreground">Campeonato</label>
          <Select
            value={championshipId}
            onChange={(e) => setChampionshipId(e.target.value)}
            className="mt-1 w-full"
          >
            <option value="">Selecione…</option>
            {championships.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Categoria</label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-1">
            Paulista Sub-11 e Sub-12 — clubes e grupos já devem estar cadastrados.
          </p>
          <Select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1 w-full"
            disabled={!championshipId}
          >
            <option value="">Todas (Sub-11 e Sub-12 no PDF)</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground">Rodada (opcional)</label>
            <input
              type="number"
              min={1}
              max={99}
              value={roundNumber}
              onChange={(e) => setRoundNumber(e.target.value)}
              placeholder="Ex.: 6"
              className="mt-1 flex h-10 w-full rounded-lg border border-line bg-graphite-light px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Grupo (opcional)</label>
            <Select
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="mt-1 w-full"
              disabled={!categoryId}
            >
              <option value="">Todos os grupos</option>
              {groups.map((g) => (
                <option key={g.value} value={g.label.split(" — ")[0] ?? g.label}>
                  {g.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">PDF da tabela (FPF)</label>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="mt-1 block w-full text-sm"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setPreview(null);
              setResult(null);
            }}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? "Analisando…" : "Gerar prévia"}
        </Button>
      </form>

      {preview && (
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Prévia da importação</h2>
              <p className="text-sm text-muted-foreground">
                {preview.championshipName} · {preview.detectedCategories.join(", ")}
              </p>
            </div>
            <Button onClick={onConfirmImport} disabled={loading || preview.totals.toCreate + preview.totals.toUpdate === 0}>
              {loading ? "Salvando…" : "Confirmar e importar"}
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="A criar" value={preview.totals.toCreate} />
            <Stat label="A atualizar" value={preview.totals.toUpdate} />
            <Stat label="Ignorados" value={preview.totals.toSkip} />
            <Stat label="Erros" value={preview.totals.errors} highlight={preview.totals.errors > 0} />
          </div>

          {preview.categories.map((cat) => (
            <div key={cat.categoryId} className="space-y-2">
              <h3 className="text-sm font-semibold">
                {cat.categoryName} ({cat.matchCountInPdf} jogos no PDF)
              </h3>
              <div className="overflow-x-auto rounded-lg border border-border max-h-80">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="p-2 text-left">#</th>
                      <th className="p-2 text-left">Rod.</th>
                      <th className="p-2 text-left">Grupo</th>
                      <th className="p-2 text-left">Confronto</th>
                      <th className="p-2 text-left">Data</th>
                      <th className="p-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.rows.map((row) => (
                      <tr key={`${row.matchNumber}-${row.homeName}`} className="border-t border-border">
                        <td className="p-2 tabular-nums">{row.matchNumber}</td>
                        <td className="p-2 tabular-nums">{row.roundNumber}</td>
                        <td className="p-2">{row.groupName}</td>
                        <td className="p-2">
                          {row.homeName} x {row.awayName}
                        </td>
                        <td className="p-2 whitespace-nowrap">
                          {new Date(row.scheduledAt).toLocaleString("pt-BR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                        <td
                          className={cn(
                            "p-2",
                            row.status === "error" && "text-destructive",
                            row.status === "create" && "text-emerald-600",
                            row.status === "update" && "text-amber-600"
                          )}
                        >
                          {STATUS_LABEL[row.status] ?? row.status}
                          {row.message ? (
                            <span className="block text-muted-foreground">{row.message}</span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>
      )}

      {s && (
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Relatório da importação</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Jogos criados" value={s.matchesCreated ?? s.matchesImported} />
            <Stat label="Jogos atualizados" value={s.matchesUpdated ?? 0} />
            <Stat label="Jogos ignorados" value={s.matchesIgnored ?? s.matchesSkippedDuplicate} />
            <Stat label="Erros" value={s.errors} highlight={s.errors > 0} />
          </div>
          <p className="text-xs text-muted-foreground">
            Rodadas/fases/locais novos podem ter sido criados sem duplicar clubes ou grupos.
          </p>
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg bg-muted/50 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-semibold tabular-nums", highlight && "text-destructive")}>
        {value}
      </p>
    </div>
  );
}
