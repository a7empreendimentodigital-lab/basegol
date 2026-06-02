"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { ClubFavoritesProvider } from "@/contexts/club-favorites-context";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { ToastProvider } from "@/components/ui/toaster";

const SESSION_REFETCH_SECONDS = 5 * 60;

type Props = {
  children: React.ReactNode;
  session: Session | null;
};

export function Providers({ children, session }: Props) {
  return (
    <SessionProvider
      session={session}
      refetchInterval={SESSION_REFETCH_SECONDS}
      refetchOnWindowFocus={false}
    >
      <ClubFavoritesProvider>
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      </ClubFavoritesProvider>
    </SessionProvider>
  );
}
