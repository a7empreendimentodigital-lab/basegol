"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RequestResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMessage("Não foi possível gerar o token de redefinição.");
      return;
    }
    if (data.resetToken) {
      setMessage(`Token de desenvolvimento: ${data.resetToken}`);
      return;
    }
    setMessage("Se o email existir, você receberá instruções de redefinição.");
  }

  return (
    <div className="min-h-screen bg-pitch flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Redefinir senha</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu email"
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
              required
            />
            <Button className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Gerar token de reset"}
            </Button>
          </form>
          {message && <p className="mt-3 text-xs text-muted-foreground break-all">{message}</p>}
          <Link href="/reset-senha/confirmar" className="mt-3 block text-xs text-neon hover:underline">
            Já tenho token
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
