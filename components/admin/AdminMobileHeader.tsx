"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { AdminNavList } from "@/components/admin/AdminNavList";
import { cn } from "@/lib/utils";

export function AdminMobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="lg:hidden sticky top-0 z-50 flex h-14 items-center justify-between gap-3 border-b border-line bg-graphite/95 px-4 backdrop-blur-xl">
        <Link href="/admin" className="min-w-0">
          <Logo size="sm" href={null} />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-foreground"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {open && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <button
            type="button"
            className="absolute inset-0 bg-pitch/80 backdrop-blur-sm"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          />
          <aside
            className={cn(
              "absolute inset-y-0 right-0 w-[min(100%,300px)] flex flex-col",
              "border-l border-line bg-graphite shadow-xl"
            )}
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-4">
              <span className="text-sm font-semibold">Menu admin</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-graphite-light"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <AdminNavList onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
