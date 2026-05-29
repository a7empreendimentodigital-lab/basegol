"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { AdminNavList } from "@/components/admin/AdminNavList";

export function AdminSidebar() {
  return (
    <aside className="hidden lg:flex w-[280px] shrink-0 flex-col border-r border-line bg-graphite/90">
      <div className="shrink-0 border-b border-line px-4 py-5 flex flex-col items-center">
        <Logo size="sidebar" href="/admin" className="w-full" />
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Painel administrativo
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <AdminNavList />
      </div>

      <div className="shrink-0 border-t border-line p-4 space-y-2">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm text-muted-foreground hover:bg-graphite-light hover:text-foreground transition-colors"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          Ver site público
        </Link>
      </div>
    </aside>
  );
}
