"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { MatchResultsImportResult } from "@/services/match-results-import/match-results-import.service";

type Option = { value: string; label: string };

const ACTION_LABEL: Record<string, string> = {
  update: "Atualizar",
  skip: "Ignorar",
  error: "Erro",
};

export function MatchResultsCsvImportPanel() {
  const [championships, setChampionships] = useState<Option[]>([]);
  const [championshipId, setChampionshipId] = useState("");
  const [categoryHint, setCategoryHint] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<MatchResultsImportResult | null>(null);
  const [result, setResult] = useState<MatchResultsImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/options/championships")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setChampionships(j.data);
      });
  }, []);

  const buildFormData = useCallback(
    (action: "preview" | "import") => {
      const fd = new FormData();
      fd.set("action", action);
      fd.set("championshipId", championshipId);
      if (categoryHint) fd.set("categoryHint", categoryHint);
      if (file) fd.set("file", file);
      return fd;
    },
    [championshipId, categoryHint, file]
  );

  async function runAction(action: "preview" | "import") {
    if (!championshipId) {
      setError("Selecione o campeonato.");
      return;
    }
    if (!file) {
      setError("Selecione um arquivo CSV.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/import/match-results-csv", {
        method: "POST",
        body: buildFormData(action),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Falha na importação");
      if (action === "preview") {
        setPreview(json.data);
        setResult(null);
      } else {
        setResult(json.data);
        setPreview(json.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  const summary = result?.summary ?? preview?.summary;

  return (
    <div className="space-y-6 rounded-xl border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Campeonato</label>
          <Select
            value={championshipId}
            onChange={(e) => {
              setChampionshipId(e.target.value);
              setPreview(null);
              setResult(null);
            }}
          >
            <option value="">Selecione…</option>
            {championships.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Categoria (opcional)</label>
          <Select value={categoryHint} onChange={(e) => setCategoryHint(e.target.value)}>
            <option value="">Todas / inferir pelo jogo</option>
            <option value="Sub-11">Sub-11</option>
            <option value="Sub-12">Sub-12</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Arquivo CSV de resultados</label>
        <input
          type="file"
          accept=".csv,.txt,text/csv"
          className="block w-full text-sm"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setPreview(null);
            setResult(null);
          }}
        />
        <p className="text-xs text-muted-foreground">
          Colunas: jogo (opcional), mandante, visitante, data, placar_casa, placar_fora, pen_casa, pen_fora,
          status. Não cria jogos novos — apenas atualiza partidas já importadas.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={loading || !file} onClick={() => runAction("preview")}>
          {loading ? "Processando…" : "Gerar prévia"}
        </Button>
        <Button
          type="button"
          disabled={loading || !file || !preview || !championshipId}
          onClick={() => runAction("import")}
        >
          Confirmar e recalcular classificação
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
          <div className="rounded-lg bg-muted/50 p-3">Total: {summary.total}</div>
          <div className="rounded-lg bg-muted/50 p-3">Atualizados: {summary.updated}</div>
          <div className="rounded-lg bg-muted/50 p-3">Erros: {summary.errors}</div>
          <div className="rounded-lg bg-muted/50 p-3 col-span-2">
            Grupos recalculados: {summary.standingsRecalculated}
          </div>
        </div>
      )}

      {preview && preview.preview.length > 0 && (
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">#</th>
                <th className="p-2">Jogo</th>
                <th className="p-2">Partida</th>
                <th className="p-2">Placar</th>
                <th className="p-2">Ação</th>
              </tr>
            </thead>
            <tbody>
              {preview.preview.map((row) => (
                <tr key={row.line} className="border-b border-border/50">
                  <td className="p-2">{row.line}</td>
                  <td className="p-2">{row.matchNumber ?? "—"}</td>
                  <td className="p-2">
                    {row.homeClub} x {row.awayClub}
                  </td>
                  <td className="p-2">
                    {row.homeScore} x {row.awayScore}
                  </td>
                  <td
                    className={cn(
                      "p-2",
                      row.action === "error" && "text-destructive",
                      row.action === "update" && "text-emerald-600"
                    )}
                  >
                    {ACTION_LABEL[row.action] ?? row.action}
                    {row.message ? ` — ${row.message}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
