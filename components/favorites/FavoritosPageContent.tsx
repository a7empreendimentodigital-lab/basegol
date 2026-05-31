"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { ChampionshipEmptyPanel } from "@/components/campeonatos/ChampionshipEmptyPanel";
import { FavoriteClubCard } from "@/components/favorites/FavoriteClubCard";
import { PublicPageBanner } from "@/components/layout/PublicPageBanner";
import { useClubFavorites } from "@/hooks/use-club-favorites";

export function FavoritosPageContent() {
  const { data: session } = useSession();
  const { items, loading, removeFavorite } = useClubFavorites();
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleRemove(clubId: string) {
    setRemovingId(clubId);
    try {
      await removeFavorite(clubId);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <>
      <PublicPageBanner title="Favoritos" />

      <main className="w-full space-y-5 px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        {!session?.user ? (
          <p className="rounded-2xl border border-line bg-graphite-light py-10 text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Faça login
            </Link>{" "}
            para ver e gerenciar clubes favoritos.
          </p>
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Carregando favoritos…
          </div>
        ) : items.length === 0 ? (
          <ChampionshipEmptyPanel icon={Heart} title="Nenhum clube favorito" />
        ) : (
          <ul className="grid w-full gap-3 sm:grid-cols-2 lg:gap-4">
            {items.map((club) => (
              <li key={club.id}>
                <FavoriteClubCard
                  club={club}
                  onRemove={handleRemove}
                  removing={removingId === club.id}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
