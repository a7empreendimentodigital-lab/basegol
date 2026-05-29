"use client";

import { AppSplashScreen } from "@/components/pwa/AppSplashScreen";

type Props = {
  imageUrl: string | null;
};

/** Wrapper client para o splash (layout raiz é Server Component). */
export function AppSplashScreenGate({ imageUrl }: Props) {
  return <AppSplashScreen imageUrl={imageUrl} />;
}
