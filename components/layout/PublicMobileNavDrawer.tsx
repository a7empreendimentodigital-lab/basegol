"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LogOut, Star, User, X } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { PublicNavLinks } from "@/components/layout/PublicNavLinks";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
  userName?: string | null;
  userImage?: string | null;
};

function DrawerSectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
      {children}
    </p>
  );
}

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

  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;
    onCloseRef.current();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevTouch = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouch;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open || !portalReady) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] md:hidden" role="presentation">
      {/* Overlay — escurece e desfoca o conteúdo da página */}
      <button
        type="button"
        className="absolute inset-0 z-[70] bg-black/75 backdrop-blur-[6px]"
        aria-label="Fechar menu"
        onClick={onClose}
      />

      {/* Painel lateral */}
      <aside
        className={cn(
          "absolute inset-y-0 left-0 z-[80] flex h-[100dvh] max-h-[100dvh] w-[min(88vw,304px)] max-w-full flex-col",
          "border-r border-white/[0.08] bg-pitch",
          "shadow-[12px_0_40px_rgba(0,0,0,0.65)]",
          "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
      >
        {/* Cabeçalho do drawer */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-foreground transition-colors hover:bg-white/[0.08]"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {/* Conta / Entrar */}
        <div className="shrink-0 px-4 py-4">
          {isLoggedIn ? (
            <Link
              href="/configuracoes/perfil"
              onClick={onClose}
              className="flex items-center gap-3 border-b border-line/60 pb-4 transition-colors hover:opacity-90"
            >
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-pitch text-sm font-semibold">
                {userImage ? (
                  <SafeImage src={userImage} alt="" fill className="object-cover" sizes="48px" />
                ) : (
                  <span aria-hidden>{initial}</span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground">Sua conta</p>
                <p className="truncate text-base font-semibold text-foreground">{displayName}</p>
              </div>
            </Link>
          ) : (
            <div className="border-b border-line/60 pb-4">
              <p className="text-sm text-muted-foreground">
                Acesse sua conta para favoritos e perfil.
              </p>
              <Link
                href="/login"
                onClick={onClose}
                className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-selected px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <User className="h-4 w-4 shrink-0" aria-hidden />
                Entrar
              </Link>
            </div>
          )}
        </div>

        {/* Navegação */}
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pb-4">
          <DrawerSectionLabel>Navegação</DrawerSectionLabel>
          <PublicNavLinks
            pathname={pathname}
            onNavigate={onClose}
            variant="drawer"
          />
        </div>

        {/* Rodapé discreto */}
        <div className="shrink-0 space-y-0.5 border-t border-white/[0.08] bg-pitch px-3 py-3">
          <Link
            href="/favoritos"
            onClick={onClose}
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
          >
            <Heart className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            Favoritos
          </Link>
          {isLoggedIn ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                void signOut({ callbackUrl: "/login" });
              }}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
            >
              <LogOut className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
              Sair
            </button>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
            >
              <Star className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
              Entrar com conta
            </Link>
          )}
        </div>
      </aside>
    </div>,
    document.body
  );
}
