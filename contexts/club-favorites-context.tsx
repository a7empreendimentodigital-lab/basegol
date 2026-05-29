"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (status === "loading") return;

    if (!session?.user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/favorites/clubs");
      if (!res.ok) {
        setItems([]);
        return;
      }
      const data = await parseApiResponse<FavoriteClub[]>(res);
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [session?.user, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const isFavorite = useCallback(
    (clubId: string) => items.some((i) => i.id === clubId),
    [items]
  );

  const removeFavorite = useCallback(
    async (clubId: string) => {
      setItems((prev) => prev.filter((i) => i.id !== clubId));
      const res = await fetch(`/api/favorites/clubs/${clubId}`, { method: "DELETE" });
      if (!res.ok) await load();
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
        if (res.ok) await load();
      }
    },
    [items, load, removeFavorite]
  );

  const value = useMemo(
    () => ({
      items,
      loading,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      reload: load,
    }),
    [items, loading, isFavorite, toggleFavorite, removeFavorite, load]
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
