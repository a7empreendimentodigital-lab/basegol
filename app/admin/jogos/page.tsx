"use client";

import { useMemo, useState } from "react";
import { AdminEntityPage } from "@/components/admin/shared/AdminEntityPage";
import { MatchForm } from "@/components/admin/forms/MatchForm";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { Select } from "@/components/ui/select";
import { MATCH_STATUS_LABELS } from "@/lib/admin-labels";
import { formatDate, formatTime } from "@/lib/utils";
import { useAdminOptions } from "@/hooks/use-admin-options";

type Row = {
  id: string;
  status: string;
  scheduledAt: string;
  venue?: string | null;
  group?: { name: string; category?: { name: string } };
  homeTeam?: { club: { name: string } };
  awayTeam?: { club: { name: string } };
};

export default function AdminJogosPage() {
  const [categoryId, setCategoryId] = useState("");
  const { options: categories } = useAdminOptions("categories");
  const extraParams = useMemo(
    () => ({ categoryId: categoryId || undefined }),
    [categoryId]
  );

  return (
    <AdminEntityPage<Row>
      entity="matches"
      title="Jogos"
      description="Agende partidas por categoria, mandante, visitante, local e status."
      searchPlaceholder="Buscar clube ou local..."
      extraParams={extraParams}
      toolbarExtras={
        <Select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="min-w-[200px]"
          aria-label="Filtrar por categoria"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      }
      FormComponent={MatchForm}
      columns={[
        {
          key: "category",
          header: "Categoria",
          cell: (r) => (
            <span className="text-sm text-muted-foreground">
              {r.group?.category?.name ?? "—"}
            </span>
          ),
        },
        {
          key: "group",
          header: "Grupo",
          cell: (r) => r.group?.name ?? "—",
        },
        {
          key: "match",
          header: "Partida",
          cell: (r) => (
            <span className="font-medium">
              {r.homeTeam?.club.name ?? "?"} x {r.awayTeam?.club.name ?? "?"}
            </span>
          ),
        },
        {
          key: "when",
          header: "Data / hora",
          cell: (r) => `${formatDate(r.scheduledAt)} · ${formatTime(r.scheduledAt)}`,
        },
        { key: "venue", header: "Local", cell: (r) => r.venue ?? "—" },
        {
          key: "status",
          header: "Status",
          cell: (r) => (
            <StatusBadge status={r.status} label={MATCH_STATUS_LABELS[r.status] ?? r.status} />
          ),
        },
      ]}
    />
  );
}
