"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toaster";

export function ContactForm() {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      subject: String(data.get("subject") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
    };

    if (!payload.name || !payload.email || !payload.message) {
      toast({ title: "Preencha nome, e-mail e mensagem.", variant: "error" });
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((json as { error?: string }).error || "Falha ao enviar");
      }
      toast({ title: "Mensagem enviada com sucesso!", variant: "success" });
      form.reset();
    } catch (err) {
      toast({
        title: "Não foi possível enviar",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-line/60 bg-graphite/40 p-5 sm:p-6">
      <h2 className="font-display text-lg tracking-wide text-foreground">Envie sua mensagem</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block" htmlFor="contact-name">
            Nome completo
          </label>
          <Input id="contact-name" name="name" required placeholder="Seu nome" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block" htmlFor="contact-email">
            E-mail
          </label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            placeholder="seu@email.com"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block" htmlFor="contact-subject">
          Assunto
        </label>
        <Input id="contact-subject" name="subject" placeholder="Assunto da mensagem" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block" htmlFor="contact-message">
          Sua mensagem
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          placeholder="Escreva sua mensagem..."
          className="w-full rounded-lg border border-line bg-graphite-light/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>
      <Button type="submit" disabled={sending} className="w-full gap-2">
        <Send className="h-4 w-4" aria-hidden />
        {sending ? "Enviando…" : "Enviar mensagem"}
      </Button>
    </form>
  );
}
