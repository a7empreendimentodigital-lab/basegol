"use client";

import { useState } from "react";
import { Printer, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";
import type { SumulaMeta } from "@/lib/sumula-types";

type Props = {
  matchId: string;
  initialMeta: SumulaMeta;
};

export function SumulaPageActions({ matchId, initialMeta }: Props) {
  const { toast } = useToast();
  const [meta, setMeta] = useState<SumulaMeta>(initialMeta);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  function printSumula() {
    window.print();
  }

  function field<K extends keyof SumulaMeta>(key: K, value: SumulaMeta[K]) {
    setMeta((m) => ({ ...m, [key]: value }));
  }

  async function saveMeta() {
    setSaving(true);
    try {
      const res = await fetch(`/api/operator/matches/${matchId}/sumula`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meta),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Falha ao salvar");
      toast({ title: "Dados da súmula salvos", variant: "success" });
      window.location.reload();
    } catch (e) {
      toast({
        title: "Erro ao salvar",
        description: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="no-print space-y-4 mb-6">
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={printSumula}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir / Baixar PDF
        </Button>
        <Button type="button" variant="outline" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Ocultar arbitragem" : "Editar arbitragem e observações"}
        </Button>
      </div>
      {showForm ? (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3 max-w-2xl">
          <h3 className="font-semibold text-sm">Arbitragem e observações (FPF)</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Árbitro</Label>
              <Input value={meta.referee ?? ""} onChange={(e) => field("referee", e.target.value)} />
            </div>
            <div>
              <Label>Assistente 1</Label>
              <Input value={meta.assistant1 ?? ""} onChange={(e) => field("assistant1", e.target.value)} />
            </div>
            <div>
              <Label>Assistente 2</Label>
              <Input value={meta.assistant2 ?? ""} onChange={(e) => field("assistant2", e.target.value)} />
            </div>
            <div>
              <Label>Quarto árbitro</Label>
              <Input
                value={meta.fourthOfficial ?? ""}
                onChange={(e) => field("fourthOfficial", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Médico ambulância</Label>
              <Input
                value={meta.ambulanceDoctor ?? ""}
                onChange={(e) => field("ambulanceDoctor", e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Ocorrências / observações</Label>
            <Textarea
              rows={3}
              value={meta.observations ?? ""}
              onChange={(e) => field("observations", e.target.value)}
            />
          </div>
          <div>
            <Label>Relatório do assistente</Label>
            <Textarea
              rows={2}
              value={meta.assistantReport ?? ""}
              onChange={(e) => field("assistantReport", e.target.value)}
            />
          </div>
          <Button type="button" disabled={saving} onClick={() => void saveMeta()}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando…" : "Salvar na súmula"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
