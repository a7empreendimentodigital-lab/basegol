"use client";

import { SessionProvider } from "next-auth/react";
import { ClubFavoritesProvider } from "@/contexts/club-favorites-context";
import { ToastProvider } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ClubFavoritesProvider>
        <ToastProvider>{children}</ToastProvider>
      </ClubFavoritesProvider>
    </SessionProvider>
  );
}
