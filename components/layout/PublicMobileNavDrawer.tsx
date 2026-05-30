"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { PublicNavLinks } from "@/components/layout/PublicNavLinks";
import { SidebarFavorites, SidebarFooterLinks } from "@/components/layout/SidebarFooter";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
  userName?: string | null;
  userImage?: string | null;
};

export function PublicMobileNavDrawer({
  open,
  onClose,
  isLoggedIn,
  userName,
  userImage,
}: Props) {
  const pathname = usePathname() ?? "/";
  const displayName = userName?.trim() || "Visitante";
  const initial = displayName.charAt(0).toUpperCase() || "?";
  const [portalReady, setPortalReady] = useState(false);
  const prevPathname = useRef(pathname);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  // Fecha só quando a rota muda — não quando onClose é recriado no pai
  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;
    onCloseRef.current();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open || !portalReady) return null;

  return createPortal(
    <div className="fixed inset-0 md:hidden" role="presentation">
      <button
        type="button"
        className="fixed inset-0 z-[70] bg-pitch/85 backdrop-blur-sm"
        aria-label="Fechar menu"
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[80] flex w-[min(100%,320px)] flex-col",
          "border-r border-line bg-graphite shadow-2xl",
          "pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
          <span className="text-sm font-semibold text-foreground">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-graphite-light"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="shrink-0 border-b border-line px-4 py-4">
          {isLoggedIn ? (
            <Link
              href="/configuracoes/perfil"
              onClick={onClose}
              className="flex min-h-11 items-center gap-3 rounded-lg transition-colors hover:bg-secondary/50"
            >
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-graphite-light text-sm font-semibold">
                {userImage ? (
                  <SafeImage src={userImage} alt="" fill className="object-cover" />
                ) : (
                  <span aria-hidden>{initial}</span>
                )}
              </span>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">Bem-vindo(a)</p>
                <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
              </div>
            </Link>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Olá, <span className="font-medium text-foreground">{displayName}</span>
              </p>
              <Link
                href="/login"
                onClick={onClose}
                className="flex min-h-11 w-full items-center justify-center rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                Entrar
              </Link>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          <PublicNavLinks pathname={pathname} onNavigate={onClose} />
          <div className="mt-4 border-t border-line pt-4">
            <SidebarFavorites isLoggedIn={isLoggedIn} />
          </div>
        </div>

        <div className="shrink-0 border-t border-line px-3 py-3">
          <SidebarFooterLinks isLoggedIn={isLoggedIn} onNavigate={onClose} />
        </div>
      </aside>
    </div>,
    document.body
  );
}
