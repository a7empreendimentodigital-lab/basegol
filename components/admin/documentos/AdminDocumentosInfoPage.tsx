"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Button } from "@/components/ui/button";

export function AdminDocumentosInfoPage() {
  return (
    <div>
      <AdminPageHeader title="Documentos" />
      <div className="glass-card max-w-xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <FileText className="h-8 w-8 text-muted-foreground shrink-0" aria-hidden />
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Laudos, autorizações e fichas de atletas são tratados no fluxo de cada clube, não
              nesta listagem geral.
            </p>
            <p>
              Para anexos de mídia (imagens e arquivos), use{" "}
              <strong className="text-foreground">Mídia</strong>.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="default">
            <Link href="/admin/clubes">Ir para clubes</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/midia">Biblioteca de mídia</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
