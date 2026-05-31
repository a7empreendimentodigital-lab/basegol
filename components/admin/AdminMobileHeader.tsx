"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { MobileBrandLogo } from "@/components/brand/MobileBrandLogo";
import { AdminNavList } from "@/components/admin/AdminNavList";
import { cn } from "@/lib/utils";

type Props = {
  mobileLogoUrl?: string | null;
  systemName?: string;
};

export function AdminMobileHeader({ mobileLogoUrl, systemName = "BASEGOL" }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "/";
  const skipPathClose = useRef(true);

  const close = () => setOpen(false);

  useEffect(() => {
    if (skipPathClose.current) {
      skipPathClose.current = false;
      return;
    }
    close();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-3 border-b border-line bg-graphite/95 px-3 backdrop-blur-xl sm:px-4 lg:hidden">
        <MobileBrandLogo
          href="/admin"
          src={mobileLogoUrl}
          systemName={systemName}
          className="min-w-0 flex-1 justify-start"
          imageClassName="max-h-10 max-w-[140px]"
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line text-foreground"
          aria-label="Abrir menu"
          aria-expanded={open}
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      </header>

      {open ? (
        <div
          className="fixed inset-0 z-[70] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu admin"
        >
          <button
            type="button"
            className="absolute inset-0 bg-pitch/85 backdrop-blur-sm"
            aria-label="Fechar menu"
            onClick={close}
          />
          <aside
            className={cn(
              "absolute inset-y-0 right-0 z-10 flex w-[min(100%,300px)] flex-col",
              "border-l border-line bg-graphite shadow-2xl",
              "pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
            )}
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <MobileBrandLogo
                href={null}
                src={mobileLogoUrl}
                systemName={systemName}
                imageClassName="max-h-9 max-w-[120px]"
              />
              <button
                type="button"
                onClick={close}
                className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-graphite-light"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
              <AdminNavList onNavigate={close} />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
