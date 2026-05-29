"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { ProfileAvatarUpload } from "@/components/profile/ProfileAvatarUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toaster";
import { apiGet, parseApiResponse } from "@/lib/api-client";

type ProfileData = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  phone: string | null;
  roleName: string;
  roleSlug: string;
};

export function ProfileForm() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [roleName, setRoleName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<ProfileData>("/api/user/profile");
      setName(data.name ?? "");
      setPhone(data.phone ?? "");
      setEmail(data.email);
      setImage(data.image);
      setRoleName(data.roleName);
    } catch {
      toast({ title: "Erro ao carregar perfil", variant: "error" });
      router.push("/login?callbackUrl=/configuracoes/perfil");
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          image,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Falha ao salvar");
      }
      const data = await parseApiResponse<ProfileData>(res);

      setName(data.name ?? "");
      setPhone(data.phone ?? "");
      setImage(data.image);

      await updateSession({
        name: data.name ?? undefined,
        image: data.image ?? undefined,
      });

      toast({ title: "Perfil atualizado", variant: "success" });
      router.refresh();
    } catch (err) {
      toast({
        title: "Erro ao salvar",
        description: err instanceof Error ? err.message : "Tente novamente",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        Carregando perfil…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <Link
        href="/configuracoes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        Voltar às configurações
      </Link>

      <div>
        <h1 className="font-display text-2xl tracking-wide text-foreground">Meu perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Atualize sua foto e dados pessoais. Perfil: {roleName}
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-6 rounded-2xl border border-line bg-graphite-light p-5 sm:p-6"
      >
        <ProfileAvatarUpload
          name={name || email}
          imageUrl={image}
          onImageChange={setImage}
          disabled={saving}
        />

        <div className="space-y-4 border-t border-line pt-5">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nome</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              disabled={saving}
              maxLength={120}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-email">E-mail</Label>
            <Input id="profile-email" value={email} disabled className="opacity-70" />
            <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado aqui.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-phone">Telefone</Label>
            <Input
              id="profile-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              disabled={saving}
              maxLength={20}
            />
          </div>
        </div>

        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden />
          ) : (
            <Save className="h-4 w-4 mr-2" aria-hidden />
          )}
          Salvar alterações
        </Button>
      </form>
    </div>
  );
}
