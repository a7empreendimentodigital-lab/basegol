import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "@/app/providers";
import { AppShellWrapper } from "@/components/layout/AppShellWrapper";
import { AppSplashScreenGate } from "@/components/pwa/AppSplashScreenGate";
import { RegisterSW } from "@/components/pwa/RegisterSW";
import { getActiveThemeConfig, getBrandConfig } from "@/lib/site-config";
import { getActiveBannersByPlacement } from "@/services/banner.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

export const metadata: Metadata = {
  title: {
    default: "BASEGOL — Campeonato Paulista de Base",
    template: "%s | BASEGOL",
  },
  description:
    "Plataforma profissional para campeonatos de base, clubes, atletas, jogos ao vivo e estatísticas.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BASEGOL",
  },
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#121212",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [theme, brand, sidebarLeftBanners, session] = await Promise.all([
    getActiveThemeConfig(),
    getBrandConfig(),
    getActiveBannersByPlacement("SIDEBAR_LEFT"),
    getServerSession(authOptions),
  ]);
  const leftSidebarBanner = sidebarLeftBanners[0] ?? null;
  const cssVars = {
    ["--primary" as string]: theme ? "111 100% 54%" : undefined,
    ["--background" as string]: theme ? "0 0% 2%" : undefined,
  } as Record<string, string | undefined>;

  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${bebas.variable} font-sans min-h-screen`}
        style={cssVars}
        suppressHydrationWarning
      >
        <Providers>
          <AppSplashScreenGate imageUrl={brand?.splashScreenUrl ?? null} />
          <RegisterSW />
          {brand?.systemName ? (
            <div className="sr-only" aria-hidden>
              {brand.systemName}
            </div>
          ) : null}
          <AppShellWrapper
            leftSidebarBanner={leftSidebarBanner}
            userName={session?.user?.name ?? null}
            userImage={session?.user?.image ?? null}
            isLoggedIn={!!session?.user}
            mobileLogoUrl={brand?.mobileLogoUrl ?? null}
          >
            {children}
          </AppShellWrapper>
        </Providers>
      </body>
    </html>
  );
}
