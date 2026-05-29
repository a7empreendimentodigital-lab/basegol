"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ConfirmResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ?? "Erro ao redefinir senha");
      return;
    }
    setMessage("Senha redefinida com sucesso. Redirecionando para login...");
    setTimeout(() => router.push("/login"), 1200);
  }

  return (
    <div className="min-h-screen bg-pitch flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Confirmar redefinição</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Token"
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
              required
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nova senha"
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
              required
            />
            <Button className="w-full" disabled={loading}>
              {loading ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
          {message && <p className="mt-3 text-xs text-muted-foreground">{message}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
