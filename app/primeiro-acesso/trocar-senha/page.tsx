"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { redirectPathForRole } from "@/lib/auth-redirect";

export default function FirstAccessPasswordPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem");
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("A nova senha deve ter no mínimo 8 caracteres");
      setLoading(false);
      return;
    }

    const email = session?.user?.email;
    if (!email) {
      setError("Sessão expirada. Faça login novamente.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/change-password-first-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword, confirmPassword }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.ok === false) {
      setError(data.error ?? "Falha ao trocar senha");
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", {
      email,
      password: newPassword,
      redirect: false,
    });

    setLoading(false);

    if (signInRes?.error) {
      setError("Senha alterada. Entre novamente com a nova senha.");
      router.push("/login");
      return;
    }

    const role = session?.user?.role;
    router.push(redirectPathForRole(role, false));
    router.refresh();
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-pitch flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pitch flex items-center justify-center p-4">
      <Card className="w-full max-w-md neon-border bg-graphite-light">
        <CardHeader>
          <CardTitle className="text-neon text-3xl font-display tracking-wide">
            Primeiro acesso
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Você já está autenticado. Defina uma nova senha pessoal para continuar.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nova senha</label>
              <input
                type="password"
                autoComplete="new-password"
                className="w-full rounded-lg border border-line bg-pitch px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-line/40"
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Confirmar nova senha</label>
              <input
                type="password"
                autoComplete="new-password"
                className="w-full rounded-lg border border-line bg-pitch px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-line/40"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Salvando..." : "Alterar senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
