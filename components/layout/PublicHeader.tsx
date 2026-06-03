"use client";

import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { useRouter } from "next/navigation";
import { memo, useCallback, useState } from "react";
import { Heart, Menu, Search, User } from "lucide-react";
import { MobileBrandLogo } from "@/components/brand/MobileBrandLogo";
import { PublicMobileNavDrawer } from "@/components/layout/PublicMobileNavDrawer";
import { useClubFavoritesCount } from "@/hooks/use-club-favorites";
import { cn } from "@/lib/utils";

type Props = {
  userName?: string | null;
  userImage?: string | null;
  isLoggedIn?: boolean;
  userRole?: string | null;
  userChampionshipId?: string | null;
  mobileLogoUrl?: string | null;
};

const touchIconBtn =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-graphite-light hover:text-foreground";

function HeaderSearch({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(query.trim());
      }}
      className="w-full"
    >
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar campeonatos, clubes ou jogos..."
          className="h-10 w-full rounded-full border border-line bg-graphite-light/90 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/25 focus:outline-none focus:ring-2 focus:ring-foreground/10"
        />
      </div>
    </form>
  );
}

function MobileUserSlot({
  userName,
  userImage,
  isLoggedIn,
}: {
  userName?: string | null;
  userImage?: string | null;
  isLoggedIn?: boolean;
}) {
  const displayName = userName ?? "Visitante";
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  const avatar = (
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-graphite-light text-sm font-semibold text-foreground">
      {userImage ? (
        <SafeImage src={userImage} alt="" fill className="object-cover" sizes="44px" />
      ) : (
        <span aria-hidden>{initial}</span>
      )}
    </span>
  );

  if (isLoggedIn) {
    return (
      <Link
        href="/configuracoes/perfil"
        className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-90"
        title="Meu perfil"
        aria-label={`Perfil de ${displayName}`}
      >
        {avatar}
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className={touchIconBtn}
      aria-label="Entrar"
      title="Entrar"
    >
      <User className="h-5 w-5" aria-hidden />
    </Link>
  );
}

function DesktopWelcomeBlock({
  userName,
  userImage,
  isLoggedIn,
}: {
  userName?: string | null;
  userImage?: string | null;
  isLoggedIn?: boolean;
}) {
  const displayName = userName ?? "Visitante";
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  const inner = (
    <>
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-graphite-light text-sm font-semibold text-foreground">
        {userImage ? (
          <SafeImage src={userImage} alt="" fill className="object-cover" sizes="40px" />
        ) : (
          <span aria-hidden>{initial}</span>
        )}
      </span>
      <div className="hidden min-w-0 sm:block">
        <p className="text-[11px] leading-none text-muted-foreground">Bem-vindo(a)</p>
        <p className="mt-1 truncate text-sm font-semibold text-foreground">{displayName}</p>
      </div>
    </>
  );

  if (isLoggedIn) {
    return (
      <Link
        href="/configuracoes/perfil"
        className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-90"
        title="Meu perfil"
      >
        {inner}
      </Link>
    );
  }

  return <div className="flex min-w-0 items-center gap-3">{inner}</div>;
}

const DesktopFavoritesButton = memo(function DesktopFavoritesButton() {
  const count = useClubFavoritesCount();

  return (
    <Link
      href="/favoritos"
      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-line px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-graphite-light hover:text-foreground"
      aria-label={count > 0 ? `Favoritos (${count})` : "Favoritos"}
    >
      <Heart className={cn("h-4 w-4", count > 0 && "fill-current text-foreground")} aria-hidden />
      <span className="hidden lg:inline">Favoritos</span>
      {count > 0 ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background tabular-nums">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
});

export function PublicHeader({
  userName,
  userImage,
  isLoggedIn,
  userRole,
  userChampionshipId,
  mobileLogoUrl,
}: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const openMenu = useCallback(() => setMenuOpen(true), []);

  function handleSearch(q: string) {
    router.push(q ? `/busca?q=${encodeURIComponent(q)}` : "/busca");
  }

  return (
    <>
      <header className="sticky top-0 z-[60] shrink-0 border-b border-line bg-pitch/95 backdrop-blur-xl">
        {/* Mobile: linha compacta + busca */}
        <div className="space-y-2 px-3 py-2 sm:px-4 md:hidden">
          <div className="grid h-12 grid-cols-[2.5rem_1fr_2.75rem] items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openMenu();
              }}
              className={cn(
                touchIconBtn,
                "h-10 w-10 border-white/10 bg-white/[0.03]",
                menuOpen && "border-selected/40 bg-selected/10 text-foreground"
              )}
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            <div className="flex min-w-0 items-center justify-center px-1">
              <MobileBrandLogo
                src={mobileLogoUrl}
                className="w-full max-w-[168px]"
                imageClassName="h-11 max-h-11 w-full max-w-[168px]"
              />
            </div>
            <div className="flex justify-end">
              <MobileUserSlot
                userName={userName}
                userImage={userImage}
                isLoggedIn={isLoggedIn}
              />
            </div>
          </div>
          <HeaderSearch onSearch={handleSearch} />
        </div>

        {/* Desktop */}
        <div className="hidden items-center gap-4 px-5 py-3.5 lg:px-6 md:flex">
          <div className="shrink-0">
            <DesktopWelcomeBlock
              userName={userName}
              userImage={userImage}
              isLoggedIn={isLoggedIn}
            />
          </div>

          <div className="mx-auto w-full max-w-2xl flex-1">
            <HeaderSearch onSearch={handleSearch} />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <DesktopFavoritesButton />
            {!isLoggedIn ? (
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-graphite-light hover:text-foreground"
              >
                <User className="h-4 w-4" aria-hidden />
                <span className="hidden xl:inline">Entrar</span>
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <PublicMobileNavDrawer
        open={menuOpen}
        onClose={closeMenu}
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        userChampionshipId={userChampionshipId}
        userName={userName}
        userImage={userImage}
      />
    </>
  );
}
