"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AthleteImportResult } from "@/services/athlete-import/athlete-import.service";

const ACTION_LABEL: Record<string, string> = {
  create: "Criar",
  update: "Atualizar",
  skip: "Ignorar",
  error: "Erro",
};

export function AthletesCsvImportPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<AthleteImportResult | null>(null);
  const [result, setResult] = useState<AthleteImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buildFormData = useCallback(
    (action: "preview" | "import") => {
      const fd = new FormData();
      fd.set("action", action);
      if (file) fd.set("file", file);
      return fd;
    },
    [file]
  );

  async function runAction(action: "preview" | "import") {
    if (!file) {
      setError("Selecione um arquivo CSV.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/import/athletes-csv", {
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
      <div className="space-y-2">
        <label className="text-sm font-medium">Arquivo CSV</label>
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
          Colunas: clube, nome, sobrenome, data_nascimento (DD/MM/AAAA), posicao, numero, categoria.
          Clubes devem já existir no sistema.
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

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg bg-muted/50 p-3">Total: {summary.total}</div>
          <div className="rounded-lg bg-muted/50 p-3">Criados: {summary.created}</div>
          <div className="rounded-lg bg-muted/50 p-3">Atualizados: {summary.updated}</div>
          <div className="rounded-lg bg-muted/50 p-3">Erros: {summary.errors}</div>
        </div>
      )}

      {preview && preview.preview.length > 0 && (
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Linha</th>
                <th className="p-2">Clube</th>
                <th className="p-2">Atleta</th>
                <th className="p-2">Categoria</th>
                <th className="p-2">Ação</th>
              </tr>
            </thead>
            <tbody>
              {preview.preview.map((row) => (
                <tr key={row.line} className="border-b border-border/50">
                  <td className="p-2">{row.line}</td>
                  <td className="p-2">{row.clubName}</td>
                  <td className="p-2">
                    {row.firstName} {row.lastName}
                  </td>
                  <td className="p-2">{row.category}</td>
                  <td
                    className={cn(
                      "p-2",
                      row.action === "error" && "text-destructive",
                      row.action === "create" && "text-emerald-600"
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
