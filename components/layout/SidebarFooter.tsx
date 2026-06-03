"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, Star } from "lucide-react";
import { StaffPanelNavLinks } from "@/components/layout/PortalNavLinks";
import { useClubFavorites } from "@/hooks/use-club-favorites";
import { TeamCrest } from "@/components/matches/TeamCrest";

type SidebarSessionProps = {
  isLoggedIn?: boolean;
};

export function SidebarFavorites({ isLoggedIn }: SidebarSessionProps) {
  const { items, loading } = useClubFavorites();

  if (!isLoggedIn) {
    return (
      <div className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
          <Star className="h-3 w-3" />
          Favoritos
        </p>
        <p className="text-xs text-muted-foreground px-2 py-1">
          <Link href="/login" className="text-selected hover:underline">
            Entre
          </Link>{" "}
          para salvar clubes favoritos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        <Star className="h-3 w-3 text-selected" />
        Favoritos
      </p>
      {loading ? (
        <p className="text-xs text-muted-foreground px-2 py-1">Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground px-2 py-1">Nenhum clube favoritado.</p>
      ) : (
        items.map((club) => (
          <Link
            key={club.id}
            href="/favoritos"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <TeamCrest url={club.crestUrl} name={club.name} size="sm" />
            <span className="flex-1 truncate">{club.name}</span>
            <Star className="h-3 w-3 text-selected fill-selected shrink-0" />
          </Link>
        ))
      )}
    </div>
  );
}

export function SidebarFooterLinks({
  isLoggedIn,
  userRole,
  userChampionshipId,
  onNavigate,
}: SidebarSessionProps & {
  userRole?: string | null;
  userChampionshipId?: string | null;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-1">
      <StaffPanelNavLinks
        userRole={userRole}
        userChampionshipId={userChampionshipId}
        currentArea="public"
        onNavigate={onNavigate}
        variant="sidebar"
      />
      {isLoggedIn ? (
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            void signOut({ callbackUrl: "/login" });
          }}
          className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden />
          Sair
        </button>
      ) : (
        <Link
          href="/login"
          onClick={onNavigate}
          className="flex min-h-11 items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          Entrar
        </Link>
      )}
    </div>
  );
}
