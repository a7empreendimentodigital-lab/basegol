import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "@/app/providers";
import { AppShellWrapper } from "@/components/layout/AppShellWrapper";
import { AppSplashScreenGate } from "@/components/pwa/AppSplashScreenGate";
import { RegisterSW } from "@/components/pwa/RegisterSW";
import { buildMetadataIcons } from "@/lib/brand-icons";
import { getCachedSidebarLeftBanner } from "@/lib/server-cache";
import { getActiveThemeConfig, getBrandConfig } from "@/lib/site-config";
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

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandConfig();
  const systemName = brand?.systemName?.trim() || "BASEGOL";

  return {
    title: {
      default: `${systemName} — Campeonato Paulista de Base`,
      template: `%s | ${systemName}`,
    },
    description:
      "Plataforma profissional para campeonatos de base, clubes, atletas, jogos ao vivo e estatísticas.",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: systemName,
    },
    icons: buildMetadataIcons(brand),
  };
}

export const viewport: Viewport = {
  themeColor: "#121212",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [theme, brand, leftSidebarBanner, session] = await Promise.all([
    getActiveThemeConfig(),
    getBrandConfig(),
    getCachedSidebarLeftBanner(),
    getServerSession(authOptions),
  ]);
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
        <Providers session={session}>
          <AppSplashScreenGate imageUrl={brand?.splashScreenUrl ?? null} />
          <RegisterSW />
          {brand?.systemName ? (
            <div className="sr-only" aria-hidden>
              {brand.systemName}
            </div>
          ) : null}
          <AppShellWrapper
            leftSidebarBanner={leftSidebarBanner}
            mobileLogoUrl={brand?.mobileLogoUrl ?? null}
            systemName={brand?.systemName ?? "BASEGOL"}
          >
            {children}
          </AppShellWrapper>
        </Providers>
      </body>
    </html>
  );
}
