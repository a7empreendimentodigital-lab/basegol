"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { parseApiResponse } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";

type Notification = {
  id: string;
  title: string;
  body?: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function ClubeNotificacoesPage() {
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    void fetch("/api/club/notifications")
      .then(async (r) => {
        if (!r.ok) return { items: [] };
        return parseApiResponse<{ items: Notification[] }>(r);
      })
      .then((d) => setItems(d.items ?? []));
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <AdminPageHeader title="Notificações" description="Comunicados e alertas do sistema." />
      <div className="space-y-2">
        {items.map((n) => (
          <div key={n.id} className={`glass-card p-4 ${!n.isRead ? "border-line ring-1 ring-line" : ""}`}>
            <p className="font-medium">{n.title}</p>
            {n.body && <p className="text-sm text-muted-foreground mt-1">{n.body}</p>}
            <p className="text-xs text-muted-foreground mt-2">{formatDate(n.createdAt)}</p>
          </div>
        ))}
        {!items.length && <p className="text-sm text-muted-foreground">Nenhuma notificação.</p>}
      </div>
    </div>
  );
}
