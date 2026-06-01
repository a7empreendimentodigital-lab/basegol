"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { parseAdminApiResponse } from "@/lib/parse-admin-api-response";
import { previewPaulistaPackFromJson } from "@/lib/paulista-pack-preview-client";
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

function mergeImportSummaries(parts: ScheduleImportSummary[]): ScheduleImportSummary {
  const merged: ScheduleImportSummary = {
    clubsCreated: 0,
    clubsReused: 0,
    venuesCreated: 0,
    venuesReused: 0,
    groupsCreated: 0,
    groupsReused: 0,
    phasesCreated: 0,
    phasesReused: 0,
    turnsCreated: 0,
    turnsReused: 0,
    roundsCreated: 0,
    roundsReused: 0,
    teamsCreated: 0,
    teamsReused: 0,
    matchesImported: 0,
    matchesCreated: 0,
    matchesUpdated: 0,
    matchesIgnored: 0,
    matchesSkippedDuplicate: 0,
    errors: 0,
    warnings: [],
  };
  for (const p of parts) {
    merged.clubsCreated += p.clubsCreated;
    merged.clubsReused += p.clubsReused;
    merged.venuesCreated += p.venuesCreated;
    merged.venuesReused += p.venuesReused;
    merged.groupsCreated += p.groupsCreated;
    merged.groupsReused += p.groupsReused;
    merged.phasesCreated += p.phasesCreated;
    merged.phasesReused += p.phasesReused;
    merged.turnsCreated += p.turnsCreated;
    merged.turnsReused += p.turnsReused;
    merged.roundsCreated += p.roundsCreated;
    merged.roundsReused += p.roundsReused;
    merged.teamsCreated += p.teamsCreated;
    merged.teamsReused += p.teamsReused;
    merged.matchesImported += p.matchesImported;
    merged.matchesCreated += p.matchesCreated;
    merged.matchesUpdated += p.matchesUpdated;
    merged.matchesIgnored += p.matchesIgnored;
    merged.matchesSkippedDuplicate += p.matchesSkippedDuplicate;
    merged.errors += p.errors;
    merged.warnings.push(...p.warnings);
  }
  return merged;
}

export function PaulistaPackImportPanel() {
  const [championships, setChampionships] = useState<Option[]>([]);
  const [championshipId, setChampionshipId] = useState("");
  const [participantsOnly, setParticipantsOnly] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PackPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/options/championships")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setChampionships(j.data);
      });
  }, []);

  const buildFormData = useCallback(
    (categoryHint?: string) => {
      const fd = new FormData();
      fd.set("action", "import");
      fd.set("championshipId", championshipId);
      fd.set("participantsOnly", String(participantsOnly));
      if (categoryHint) fd.set("categoryHint", categoryHint);
      if (file) fd.set("file", file);
      return fd;
    },
    [championshipId, participantsOnly, file]
  );

  async function onPreview() {
    if (!file) {
      setError("Selecione o arquivo JSON do pacote.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const text = await file.text();
      const raw = JSON.parse(text) as unknown;
      setPreview(previewPaulistaPackFromJson(raw));
    } catch (e) {
      setPreview(null);
      setError(e instanceof Error ? e.message : "JSON inválido");
    } finally {
      setLoading(false);
    }
  }

  async function onImport() {
    if (!championshipId) {
      setError("Selecione o campeonato.");
      return;
    }
    if (!file) {
      setError("Selecione o arquivo JSON do pacote.");
      return;
    }
    if (!preview) {
      setError("Gere a prévia antes de confirmar.");
      return;
    }
    setLoading(true);
    setError(null);
    setProgress(null);
    try {
      const categories = preview.categories.map((c) => c.categoryHint);
      const summaries: ScheduleImportSummary[] = [];
      let lastPayload: ImportResult | null = null;

      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        setProgress(`Importando ${cat} (${i + 1} de ${categories.length})…`);
        const res = await fetch("/api/admin/import/paulista-pack", {
          method: "POST",
          body: buildFormData(cat),
        });
        const json = await parseAdminApiResponse(res);
        if (!json.ok) {
          setError(
            json.error ??
              `Falha ao importar ${cat}. Tente o script CLI: npm run import:paulista-pack`
          );
          return;
        }
        const data = json.data as ImportResult;
        summaries.push(data.summary);
        lastPayload = data;
      }

      if (lastPayload) {
        setResult({
          ...lastPayload,
          summary: mergeImportSummaries(summaries),
        });
      }
    } catch {
      setError("Erro de rede ao importar. Se persistir, use o script CLI (npm run import:paulista-pack).");
    } finally {
      setLoading(false);
      setProgress(null);
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
          Envie <code className="text-xs">basegol_paulista_import_2026.json</code>. A prévia é local; a confirmação
          importa Sub-11 e Sub-12 em duas etapas no servidor.
        </p>
      </div>

      {progress && <p className="text-sm text-primary">{progress}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={loading || !file} onClick={onPreview}>
          {loading && !preview ? "Processando…" : "Gerar prévia"}
        </Button>
        <Button type="button" disabled={loading || !file || !preview} onClick={onImport}>
          {loading && preview ? "Importando…" : "Confirmar importação"}
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
