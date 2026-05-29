import Link from "next/link";
import { ClubProfileForm } from "@/components/clube/forms/ClubProfileForm";

export default function ClubePerfilPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Link href="/clube" className="text-xs text-muted-foreground hover:text-neon">
        ← Voltar ao painel
      </Link>
      <h1 className="font-display text-3xl text-neon">Perfil do clube</h1>
      <ClubProfileForm />
    </div>
  );
}
