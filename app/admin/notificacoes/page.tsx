"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { useToast } from "@/components/ui/toaster";
import { formatDate } from "@/lib/utils";

type Notification = {
  id: string;
  title: string;
  body?: string | null;
  createdAt: string;
  user?: { email: string | null };
};

export default function AdminNotificacoesPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Notification[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");

  async function load() {
    const res = await fetch("/api/admin/crud/notifications?page=1&pageSize=50").catch(() => null);
    if (res?.ok) {
      const json = await res.json();
      setItems(json.data?.items ?? []);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function send() {
    const userRes = await fetch(`/api/admin/users?q=${encodeURIComponent(email)}&pageSize=1`);
    const userJson = await userRes.json();
    const userId = userJson.data?.items?.[0]?.id;
    if (!userId) {
      toast({ title: "Usuário não encontrado", variant: "error" });
      return;
    }
    const res = await fetch("/api/admin/crud/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, type: "SYSTEM", title, body, isRead: false }),
    });
    if (res.ok) {
      toast({ title: "Notificação enviada", variant: "success" });
      setTitle("");
      setBody("");
      void load();
    }
  }

  return (
    <div className="max-w-3xl">
      <AdminPageHeader title="Notificações" description="Envie comunicados para usuários do sistema." />
      <div className="glass-card p-4 space-y-3 mb-6">
        <Input placeholder="E-mail do destinatário" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input placeholder="Mensagem" value={body} onChange={(e) => setBody(e.target.value)} />
        <Button onClick={send}>Enviar notificação</Button>
      </div>
      <div className="space-y-2">
        {items.map((n) => (
          <div key={n.id} className="glass-card p-3 text-sm">
            <p className="font-medium">{n.title}</p>
            <p className="text-muted-foreground">{n.body}</p>
            <p className="text-xs mt-1">{n.user?.email} · {formatDate(n.createdAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
