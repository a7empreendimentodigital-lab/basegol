"use client";

import Link from "next/link";
import { ExternalLink, LayoutDashboard } from "lucide-react";
import { canAccessAdminPanel } from "@/lib/rbac";
import { cn } from "@/lib/utils";

type Variant = "sidebar" | "drawer" | "admin";

function linkClass(variant: Variant, className?: string) {
  return cn(
    "flex items-center gap-2 font-medium transition-colors",
    variant === "sidebar" &&
      "min-h-11 w-full rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground",
    variant === "drawer" &&
      "min-h-11 w-full rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/[0.05] hover:text-foreground",
    variant === "admin" &&
      "w-full justify-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm text-muted-foreground hover:bg-graphite-light hover:text-foreground",
    className
  );
}

/** Link do site público para o painel admin (usuários com permissão). */
export function AdminPanelNavLink({
  userRole,
  onNavigate,
  variant = "sidebar",
  className,
}: {
  userRole?: string | null;
  onNavigate?: () => void;
  variant?: Variant;
  className?: string;
}) {
  if (!canAccessAdminPanel(userRole)) return null;

  return (
    <Link
      href="/admin"
      onClick={onNavigate}
      className={linkClass(variant, className)}
    >
      <LayoutDashboard className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
      Painel admin
    </Link>
  );
}

/** Link do admin para o site público. */
export function PublicSiteNavLink({
  onNavigate,
  variant = "admin",
  className,
}: {
  onNavigate?: () => void;
  variant?: Variant;
  className?: string;
}) {
  return (
    <Link href="/" onClick={onNavigate} className={linkClass(variant, className)}>
      <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
      Acessar o sistema
    </Link>
  );
}
