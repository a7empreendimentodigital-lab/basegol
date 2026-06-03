"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ChampionshipForm } from "@/components/admin/forms/ChampionshipForm";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";

export default function AdminCampeonatoNovoPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/campeonatos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Voltar
      </Link>
      <AdminPageHeader title="Novo campeonato" description="Cadastre uma nova competição." />
      <div className="glass-card p-6 max-w-2xl">
        <ChampionshipForm
          initial={null}
          onSuccess={() => router.push("/admin/campeonatos")}
          onCancel={() => router.push("/admin/campeonatos")}
        />
      </div>
    </div>
  );
}
