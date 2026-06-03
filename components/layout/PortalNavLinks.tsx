"use client";

import Link from "next/link";
import { ExternalLink, LayoutDashboard, Shield, Radio, BarChart3 } from "lucide-react";
import {
  getStaffPanelsForRole,
  isStaffRole,
  staffPanelsForContext,
  type PortalArea,
  type StaffPanelItem,
} from "@/lib/portal-nav";
import { cn } from "@/lib/utils";

type Variant = "sidebar" | "drawer" | "admin" | "bar";

function linkClass(variant: Variant, className?: string) {
  return cn(
    "flex items-center gap-2 font-medium transition-colors",
    variant === "sidebar" &&
      "min-h-11 w-full rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground",
    variant === "drawer" &&
      "min-h-11 w-full rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/[0.05] hover:text-foreground",
    variant === "admin" &&
      "w-full justify-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm text-muted-foreground hover:bg-graphite-light hover:text-foreground",
    variant === "bar" &&
      "shrink-0 rounded-lg border border-line px-3 py-2 text-sm text-muted-foreground hover:bg-graphite-light hover:text-foreground",
    className
  );
}

function panelIcon(panel: StaffPanelItem) {
  if (panel.href === "/admin") return LayoutDashboard;
  if (panel.href === "/clube") return Shield;
  if (panel.href === "/operador") return Radio;
  return BarChart3;
}

function StaffPanelLink({
  panel,
  onNavigate,
  variant,
  className,
}: {
  panel: StaffPanelItem;
  onNavigate?: () => void;
  variant: Variant;
  className?: string;
}) {
  const Icon = panelIcon(panel);
  return (
    <Link href={panel.href} onClick={onNavigate} className={linkClass(variant, className)}>
      <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
      {panel.label}
    </Link>
  );
}

/** Links para painéis internos (site público). */
export function StaffPanelNavLinks({
  userRole,
  userChampionshipId,
  currentArea = "public",
  onNavigate,
  variant = "sidebar",
  className,
}: {
  userRole?: string | null;
  userChampionshipId?: string | null;
  currentArea?: PortalArea;
  onNavigate?: () => void;
  variant?: Variant;
  className?: string;
}) {
  const panels =
    currentArea === "public"
      ? getStaffPanelsForRole(userRole, userChampionshipId)
      : staffPanelsForContext(userRole, currentArea, userChampionshipId);

  if (panels.length === 0) return null;

  return (
    <div className={cn(variant === "sidebar" || variant === "drawer" ? "space-y-1" : "contents", className)}>
      {panels.map((panel) => (
        <StaffPanelLink
          key={panel.href}
          panel={panel}
          onNavigate={onNavigate}
          variant={variant}
        />
      ))}
    </div>
  );
}

/** @deprecated Use StaffPanelNavLinks — mantido para imports antigos. */
export function AdminPanelNavLink({
  userRole,
  userChampionshipId,
  onNavigate,
  variant = "sidebar",
  className,
}: {
  userRole?: string | null;
  userChampionshipId?: string | null;
  onNavigate?: () => void;
  variant?: Variant;
  className?: string;
}) {
  return (
    <StaffPanelNavLinks
      userRole={userRole}
      userChampionshipId={userChampionshipId}
      currentArea="public"
      onNavigate={onNavigate}
      variant={variant}
      className={className}
    />
  );
}

/** Link para o site público (painéis internos). */
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
      Site público
    </Link>
  );
}

/** Barra de troca entre site público e painéis do papel. */
export function StaffPortalBar({
  userRole,
  userChampionshipId,
  currentArea,
  onNavigate,
  variant = "bar",
}: {
  userRole?: string | null;
  userChampionshipId?: string | null;
  currentArea: PortalArea;
  onNavigate?: () => void;
  variant?: "bar" | "stacked";
}) {
  if (!isStaffRole(userRole, userChampionshipId)) return null;

  const panels = staffPanelsForContext(userRole, currentArea, userChampionshipId);
  const showPublic = currentArea !== "public";

  if (!showPublic && panels.length === 0) return null;

  const isStacked = variant === "stacked";

  return (
    <div
      className={cn(
        "border-line bg-graphite/30",
        isStacked ? "space-y-2 border-t p-4" : "flex flex-wrap gap-2 border-b px-3 py-2.5 sm:px-4"
      )}
    >
      {showPublic ? (
        <PublicSiteNavLink
          onNavigate={onNavigate}
          variant={isStacked ? "admin" : "bar"}
          className={!isStacked ? undefined : undefined}
        />
      ) : null}
      <StaffPanelNavLinks
        userRole={userRole}
        userChampionshipId={userChampionshipId}
        currentArea={currentArea}
        onNavigate={onNavigate}
        variant={isStacked ? "admin" : "bar"}
      />
    </div>
  );
}
