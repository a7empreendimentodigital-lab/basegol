"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { parseApiResponse } from "@/lib/api-client";

export type FavoriteClub = {
  id: string;
  slug: string;
  name: string;
  crestUrl: string | null;
  city: string | null;
};

type ClubFavoritesContextValue = {
  items: FavoriteClub[];
  favoriteCount: number;
  loading: boolean;
  isFavorite: (clubId: string) => boolean;
  toggleFavorite: (clubId: string) => Promise<void>;
  removeFavorite: (clubId: string) => Promise<void>;
  reload: () => Promise<void>;
};

const ClubFavoritesContext = createContext<ClubFavoritesContextValue | null>(null);

export function ClubFavoritesProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<FavoriteClub[]>([]);
  const [loading, setLoading] = useState(false);
  const loadedUserId = useRef<string | null>(null);
  const userId = session?.user?.id ?? null;

  const load = useCallback(async (force = false) => {
    if (status === "loading") return;

    if (!userId) {
      setItems([]);
      setLoading(false);
      loadedUserId.current = null;
      return;
    }

    if (!force && loadedUserId.current === userId) return;

    setLoading(true);
    try {
      const res = await fetch("/api/favorites/clubs");
      if (!res.ok) {
        setItems([]);
        return;
      }
      const data = await parseApiResponse<FavoriteClub[]>(res);
      setItems(Array.isArray(data) ? data : []);
      loadedUserId.current = userId;
    } finally {
      setLoading(false);
    }
  }, [status, userId]);

  useEffect(() => {
    if (status === "loading") return;
    if (!userId) {
      setItems([]);
      setLoading(false);
      loadedUserId.current = null;
      return;
    }
    if (loadedUserId.current === userId) return;
    void load();
  }, [status, userId, load]);

  const isFavorite = useCallback(
    (clubId: string) => items.some((i) => i.id === clubId),
    [items]
  );

  const removeFavorite = useCallback(
    async (clubId: string) => {
      setItems((prev) => prev.filter((i) => i.id !== clubId));
      const res = await fetch(`/api/favorites/clubs/${clubId}`, { method: "DELETE" });
      if (!res.ok) await load(true);
    },
    [load]
  );

  const toggleFavorite = useCallback(
    async (clubId: string) => {
      const exists = items.some((i) => i.id === clubId);
      if (exists) {
        await removeFavorite(clubId);
      } else {
        const res = await fetch("/api/favorites/clubs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clubId }),
        });
        if (res.ok) await load(true);
      }
    },
    [items, load, removeFavorite]
  );

  const favoriteCount = items.length;

  const value = useMemo(
    () => ({
      items,
      favoriteCount,
      loading,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      reload: () => load(true),
    }),
    [items, favoriteCount, loading, isFavorite, toggleFavorite, removeFavorite, load]
  );

  return (
    <ClubFavoritesContext.Provider value={value}>{children}</ClubFavoritesContext.Provider>
  );
}

export function useClubFavorites() {
  const ctx = useContext(ClubFavoritesContext);
  if (!ctx) {
    throw new Error("useClubFavorites deve ser usado dentro de ClubFavoritesProvider");
  }
  return ctx;
}

/** Contador para o header — evita depender do array completo de favoritos. */
export function useClubFavoritesCount() {
  const ctx = useContext(ClubFavoritesContext);
  if (!ctx) return 0;
  return ctx.favoriteCount;
}
