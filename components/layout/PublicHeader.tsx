"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Search, User } from "lucide-react";
import { MobileBrandLogo } from "@/components/brand/MobileBrandLogo";
import { useClubFavorites } from "@/hooks/use-club-favorites";
import { cn } from "@/lib/utils";

type Props = {
  userName?: string | null;
  userImage?: string | null;
  isLoggedIn?: boolean;
  mobileLogoUrl?: string | null;
};

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
          className="h-11 w-full rounded-full border border-line bg-graphite-light/90 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/25 focus:outline-none focus:ring-2 focus:ring-foreground/10"
        />
      </div>
    </form>
  );
}

function WelcomeBlock({
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
          <Image
            src={userImage}
            alt=""
            fill
            className="object-cover"
            unoptimized={userImage.startsWith("/uploads/")}
          />
        ) : (
          <span aria-hidden>{initial}</span>
        )}
      </span>
      <div className="hidden min-w-0 sm:block">
        <p className="text-[11px] leading-none text-muted-foreground">Bem-vindo(a)</p>
        <p className="mt-1 truncate text-sm font-semibold text-foreground">{displayName}</p>
      </div>
      <p className="truncate text-sm font-semibold text-foreground sm:hidden">{displayName}</p>
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

function FavoritesButton() {
  const { items } = useClubFavorites();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const count = mounted ? items.length : 0;

  return (
    <Link
      href="/favoritos"
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full border border-line px-3 py-2 text-sm font-medium transition-colors",
        "text-muted-foreground hover:border-foreground/30 hover:bg-graphite-light hover:text-foreground"
      )}
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
}

export function PublicHeader({ userName, userImage, isLoggedIn, mobileLogoUrl }: Props) {
  const router = useRouter();

  function handleSearch(q: string) {
    router.push(q ? `/busca?q=${encodeURIComponent(q)}` : "/busca");
  }

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-line bg-pitch/95 backdrop-blur-xl">
      {/* Mobile */}
      <div className="space-y-3 px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <MobileBrandLogo src={mobileLogoUrl} imageClassName="h-10 w-10" />
          <div className="min-w-0 flex-1">
            <WelcomeBlock userName={userName} userImage={userImage} isLoggedIn={isLoggedIn} />
          </div>
          <FavoritesButton />
        </div>
        <HeaderSearch onSearch={handleSearch} />
      </div>

      {/* Desktop */}
      <div className="hidden items-center gap-4 px-5 py-3.5 lg:px-6 md:flex">
        <div className="shrink-0">
          <WelcomeBlock userName={userName} userImage={userImage} isLoggedIn={isLoggedIn} />
        </div>

        <div className="mx-auto w-full max-w-2xl flex-1">
          <HeaderSearch onSearch={handleSearch} />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <FavoritesButton />
          {!isLoggedIn ? (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-graphite-light hover:text-foreground"
            >
              <User className="h-4 w-4" aria-hidden />
              <span className="hidden xl:inline">Entrar</span>
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
