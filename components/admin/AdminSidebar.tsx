"use client";

import { Logo } from "@/components/brand/Logo";
import { AdminNavList } from "@/components/admin/AdminNavList";
import { PublicSiteNavLink } from "@/components/layout/PortalNavLinks";

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

      <div className="shrink-0 border-t border-line p-4">
        <PublicSiteNavLink variant="admin" />
      </div>
    </aside>
  );
}
