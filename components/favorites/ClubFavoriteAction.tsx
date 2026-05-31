"use client";

import { Heart, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useClubFavorites } from "@/hooks/use-club-favorites";
import { cn } from "@/lib/utils";

export function ClubFavoriteAction({
  clubId,
  className,
}: {
  clubId: string;
  className?: string;
}) {
  const { data: session } = useSession();
  const { isFavorite, toggleFavorite } = useClubFavorites();
  const [busy, setBusy] = useState(false);
  const active = isFavorite(clubId);

  if (!session?.user) return null;

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await toggleFavorite(clubId);
        } finally {
          setBusy(false);
        }
      }}
      className={cn(
        "inline-flex w-fit max-w-full items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-line bg-graphite text-muted-foreground hover:text-foreground"
          : "border-foreground bg-foreground text-background hover:opacity-90",
        className
      )}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Heart className={cn("h-4 w-4", active && "fill-current")} aria-hidden />
      )}
      {active ? "Remover dos favoritos" : "Salvar nos favoritos"}
    </button>
  );
}
