"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { ScheduleImportSummary } from "@/services/schedule-import/schedule-import.service";

type Option = { value: string; label: string };

type PackPreview = {
  season: number;
  categories: Array<{
    categoryHint: string;
    participants: number;
    matches: number;
    warnings: string[];
  }>;
  totals: { participants: number; matches: number };
};

type ImportResult = {
  importId: string;
  summary: ScheduleImportSummary;
  parsed: { matchCount: number; title: string };
};

export function PaulistaPackImportPanel() {
  const [championships, setChampionships] = useState<Option[]>([]);
  const [championshipId, setChampionshipId] = useState("");
  const [participantsOnly, setParticipantsOnly] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PackPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
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
      fd.set("participantsOnly", String(participantsOnly));
      if (file) fd.set("file", file);
      return fd;
    },
    [championshipId, participantsOnly, file]
  );

  async function runAction(action: "preview" | "import") {
    if (!championshipId) {
      setError("Selecione o campeonato.");
      return;
    }
    if (!file) {
      setError("Selecione o arquivo JSON do pacote.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/import/paulista-pack", {
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
        setPreview(json.data?.preview ?? preview);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  const summary = result?.summary;

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
        <div className="space-y-2 flex flex-col justify-end">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={participantsOnly}
              onChange={(e) => setParticipantsOnly(e.target.checked)}
            />
            Somente clubes, grupos e times (sem jogos)
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Pacote JSON (FPF 2026)</label>
        <input
          type="file"
          accept=".json,application/json"
          className="block w-full text-sm"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setPreview(null);
            setResult(null);
          }}
        />
        <p className="text-xs text-muted-foreground">
          Envie <code className="text-xs">basegol_paulista_import_2026.json</code> ou use o script com a
          pasta de CSVs. Reimportação é segura (não duplica clubes, grupos nem jogos).
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={loading || !file} onClick={() => runAction("preview")}>
          {loading ? "Processando…" : "Gerar prévia"}
        </Button>
        <Button type="button" disabled={loading || !file || !preview} onClick={() => runAction("import")}>
          Confirmar importação
        </Button>
      </div>

      {preview && (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">Temporada {preview.season}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/50 p-3">Participantes: {preview.totals.participants}</div>
            <div className="rounded-lg bg-muted/50 p-3">Jogos: {preview.totals.matches}</div>
          </div>
          <ul className="list-disc pl-5 space-y-1">
            {preview.categories.map((c) => (
              <li key={c.categoryHint}>
                <strong>{c.categoryHint}</strong> — {c.participants} clubes, {c.matches} jogos
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg bg-muted/50 p-3">Jogos criados: {summary.matchesCreated}</div>
          <div className="rounded-lg bg-muted/50 p-3">Ignorados: {summary.matchesSkippedDuplicate}</div>
          <div className="rounded-lg bg-muted/50 p-3">Clubes novos: {summary.clubsCreated}</div>
          <div className="rounded-lg bg-muted/50 p-3">Erros: {summary.errors}</div>
        </div>
      )}
    </div>
  );
}
