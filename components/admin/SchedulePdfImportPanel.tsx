"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ScheduleImportSummary } from "@/services/schedule-import/schedule-import.service";

type Option = { value: string; label: string };

type ImportResult = {
  importId: string;
  summary: ScheduleImportSummary;
  detectedInPdf?: string[];
  categories?: Array<{ categoryHint: string; categoryName: string; matchCount: number }>;
  parsed: { matchCount: number; title: string };
};

type ImportLog = {
  id: string;
  level: string;
  message: string;
  createdAt: string;
};

type ImportDetail = {
  id: string;
  fileName: string;
  status: string;
  summary: ScheduleImportSummary | null;
  logs: ImportLog[];
  championship?: { name: string };
  category?: { name: string } | null;
};

export function SchedulePdfImportPanel() {
  const [championships, setChampionships] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [championshipId, setChampionshipId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [autoCreateCategory, setAutoCreateCategory] = useState(true);
  const [participantsOnly, setParticipantsOnly] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [detail, setDetail] = useState<ImportDetail | null>(null);
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
        if (j.ok) setCategories(j.data);
      });
  }, [championshipId]);

  const loadDetail = useCallback(async (importId: string) => {
    const res = await fetch(`/api/admin/import/schedule-pdf?id=${importId}`);
    const json = await res.json();
    if (json.ok) setDetail(json.data);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setDetail(null);
    if (!file || !championshipId) {
      setError("Selecione campeonato e arquivo PDF.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("championshipId", championshipId);
      if (categoryId) fd.append("categoryId", categoryId);
      fd.append("autoCreateCategory", String(autoCreateCategory));
      fd.append("participantsOnly", String(participantsOnly));
      const res = await fetch("/api/admin/import/schedule-pdf", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Falha na importação");
        return;
      }
      setResult(json.data);
      await loadDetail(json.data.importId);
    } catch {
      setError("Erro de rede ao importar.");
    } finally {
      setLoading(false);
    }
  };

  const s = result?.summary;

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="rounded-xl border border-border bg-card p-6 space-y-4 max-w-xl">
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
          <label className="text-sm font-medium text-foreground">Categoria (opcional)</label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-1">
            PDF separado por categoria (só Sub-11 ou só Sub-12): deixe em &quot;Todas as categorias&quot; —
            o sistema detecta pelo título do arquivo. Se quiser forçar, escolha Sub-11 ou Sub-12 na lista.
          </p>
          <Select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1 w-full"
            disabled={!championshipId}
          >
            <option value="">Todas as categorias do PDF (recomendado)</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
          <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={autoCreateCategory}
              onChange={(e) => setAutoCreateCategory(e.target.checked)}
            />
            Criar categoria automaticamente se não existir (ex.: Sub-11)
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={participantsOnly}
              onChange={(e) => setParticipantsOnly(e.target.checked)}
            />
            Só clubes e grupos (sem jogos) — use o PDF só com participantes
          </label>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">PDF da tabela oficial (FPF)</label>
          <p className="text-xs text-muted-foreground mt-0.5">
            PDF separado (ex.: Sub-11-1-2.pdf com lista de clubes por grupo): marque a opção acima e
            cadastre os jogos depois no admin. Se já importou antes e há clubes duplicados, rode o
            script <code className="text-xs">reset-schedule-import-data.ts</code> no projeto antes de
            reimportar.
          </p>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="mt-1 block w-full text-sm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Importando…" : "Importar tabela"}
        </Button>
      </form>

      {s && (
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Resultado da importação</h2>
          {result?.parsed?.title && (
            <p className="text-sm text-muted-foreground">Documento: {result.parsed.title}</p>
          )}
          {result?.detectedInPdf && result.detectedInPdf.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Categorias no PDF: {result.detectedInPdf.join(", ")}
            </p>
          )}
          {s.byCategory && s.byCategory.length > 1 && (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2 font-medium">Categoria</th>
                    <th className="text-right p-2 font-medium">Jogos novos</th>
                    <th className="text-right p-2 font-medium">Já existentes</th>
                  </tr>
                </thead>
                <tbody>
                  {s.byCategory.map((row) => (
                    <tr key={row.categoryId} className="border-t border-border">
                      <td className="p-2">{row.categoryHint}</td>
                      <td className="p-2 text-right tabular-nums">{row.matchesImported}</td>
                      <td className="p-2 text-right tabular-nums">{row.matchesSkippedDuplicate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Clubes criados" value={s.clubsCreated} />
            <Stat label="Clubes reutilizados" value={s.clubsReused} />
            <Stat label="Jogos importados" value={s.matchesImported} />
            <Stat label="Jogos já existentes" value={s.matchesSkippedDuplicate} />
            <Stat label="Grupos criados" value={s.groupsCreated} />
            <Stat label="Grupos reutilizados" value={s.groupsReused} />
            <Stat label="Locais criados" value={s.venuesCreated} />
            <Stat label="Erros" value={s.errors} highlight={s.errors > 0} />
          </div>
          {s.warnings.length > 0 && (
            <div className="text-sm text-amber-700 dark:text-amber-400">
              <p className="font-medium">Avisos ({s.warnings.length})</p>
              <ul className="list-disc pl-5 mt-1 max-h-32 overflow-y-auto">
                {s.warnings.slice(0, 20).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {detail && detail.logs.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-3">Log completo</h2>
          <div className="max-h-96 overflow-y-auto font-mono text-xs space-y-1">
            {detail.logs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  "py-1 border-b border-border/50",
                  log.level === "ERROR" && "text-destructive",
                  log.level === "WARN" && "text-amber-600"
                )}
              >
                <span className="text-muted-foreground">
                  {new Date(log.createdAt).toLocaleTimeString("pt-BR")}{" "}
                </span>
                [{log.level}] {log.message}
              </div>
            ))}
          </div>
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
