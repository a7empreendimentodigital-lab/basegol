"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { RoundResultsPdfImportResult } from "@/services/match-results-import/round-results-pdf-import.service";

type Option = { value: string; label: string };

const ACTION_LABEL: Record<string, string> = {
  update: "Atualizar placar",
  create: "Criar jogo",
  error: "Erro",
};

export function RoundResultsPdfImportPanel() {
  const [championships, setChampionships] = useState<Option[]>([]);
  const [championshipId, setChampionshipId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<RoundResultsPdfImportResult | null>(null);
  const [result, setResult] = useState<RoundResultsPdfImportResult | null>(null);
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
      if (file) fd.set("file", file);
      return fd;
    },
    [championshipId, file]
  );

  async function runAction(action: "preview" | "import") {
    if (!championshipId) {
      setError("Selecione o campeonato.");
      return;
    }
    if (!file) {
      setError("Selecione o PDF da rodada.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/import/round-results-pdf", {
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

  const data = result ?? preview;

  return (
    <div className="glass-card space-y-6 p-6">
      <div>
        <h2 className="text-lg font-semibold">Importar rodada (PDF FPF)</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          Envie o PDF exportado em{" "}
          <strong>futebolpaulista.com.br → Competições → Tabela</strong> (um arquivo por
          rodada, com placar). O sistema lê número do jogo, data, mandante, visitante, placar,
          local e cidade. Sub-11 e Sub-12 podem vir no mesmo PDF.
        </p>
      </div>

      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void runAction("preview");
        }}
      >
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium">Campeonato</label>
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

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium">PDF da rodada</label>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border file:border-line file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-medium file:text-foreground"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setPreview(null);
              setResult(null);
            }}
          />
        </div>

        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" variant="outline" disabled={loading}>
            {loading ? "Processando…" : "Gerar prévia"}
          </Button>
          <Button
            type="button"
            disabled={loading || !preview}
            onClick={() => void runAction("import")}
          >
            {loading ? "Salvando…" : "Importar rodada"}
          </Button>
        </div>
      </form>

      {error ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {data ? (
        <div className="space-y-4 border-t border-line pt-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              Rodada(s):{" "}
              <strong>{data.summary.roundNumbers.join(", ") || "—"}</strong>
            </span>
            <span>
              Jogos no PDF: <strong>{data.summary.total}</strong>
            </span>
            <span className="text-emerald-400">
              Atualizar: <strong>{data.summary.updated}</strong>
            </span>
            <span className="text-sky-400">
              Criar: <strong>{data.summary.created}</strong>
            </span>
            <span className="text-destructive">
              Erros: <strong>{data.summary.errors}</strong>
            </span>
          </div>

          {data.warnings.length > 0 ? (
            <ul className="text-xs text-amber-400/90 list-disc pl-5 space-y-1">
              {data.warnings.slice(0, 8).map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}

          <div className="max-h-[420px] overflow-auto rounded-lg border border-line">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-graphite text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 text-left">Jogo</th>
                  <th className="px-2 py-2 text-left">Rod.</th>
                  <th className="px-2 py-2 text-left">Confronto</th>
                  <th className="px-2 py-2 text-center">Placar</th>
                  <th className="px-2 py-2 text-left">Ação</th>
                </tr>
              </thead>
              <tbody>
                {data.preview.map((row) => (
                  <tr key={row.matchNumber} className="border-t border-line/60">
                    <td className="px-2 py-1.5 tabular-nums">{row.matchNumber}</td>
                    <td className="px-2 py-1.5 tabular-nums">{row.roundNumber}</td>
                    <td className="px-2 py-1.5">
                      {row.homeClub} × {row.awayClub}
                    </td>
                    <td className="px-2 py-1.5 text-center tabular-nums">
                      {row.homeScore}–{row.awayScore}
                    </td>
                    <td
                      className={cn(
                        "px-2 py-1.5",
                        row.action === "error" && "text-destructive",
                        row.action === "create" && "text-sky-400",
                        row.action === "update" && "text-emerald-400"
                      )}
                    >
                      {ACTION_LABEL[row.action]}
                      {row.message ? (
                        <span className="block text-[10px] text-muted-foreground">
                          {row.message}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
