"use client";

import { memo } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNavClient } from "@/components/layout/BottomNavClient";
import { PublicTopBar } from "@/components/layout/PublicTopBar";
import { InstallPwaPrompt } from "@/components/pwa/InstallPwaPrompt";
import { StaffPortalBar } from "@/components/layout/PortalNavLinks";
import { SiteFooterClient } from "@/components/layout/SiteFooterClient";
import { isAuthRoute, isPublicAppRoute } from "@/lib/public-routes";
import { isPortalEntryRoute } from "@/lib/portal-routes";
import type { PublicBannerDto } from "@/services/banner.service";

type Props = {
  children: React.ReactNode;
  leftSidebarBanner?: PublicBannerDto | null;
  userName?: string | null;
  userImage?: string | null;
  isLoggedIn?: boolean;
  userRole?: string | null;
  userChampionshipId?: string | null;
  mobileLogoUrl?: string | null;
  systemName?: string;
};

type PublicChromeProps = Props;

const PublicAppChrome = memo(function PublicAppChrome({
  children,
  leftSidebarBanner,
  userName,
  userImage,
  isLoggedIn,
  userRole,
  userChampionshipId,
  mobileLogoUrl,
  systemName = "BASEGOL",
}: PublicChromeProps) {
  return (
    <>
      <Sidebar
        leftBanner={leftSidebarBanner}
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        userChampionshipId={userChampionshipId}
      />
      <div className="flex min-h-screen flex-col pb-16 md:pb-0 md:pl-64 lg:pl-72">
        <PublicTopBar
          userName={userName}
          userImage={userImage}
          isLoggedIn={isLoggedIn}
          userRole={userRole}
          userChampionshipId={userChampionshipId}
          mobileLogoUrl={mobileLogoUrl}
        />
        <div className="flex flex-1 flex-col w-full min-h-0">
          {children}
        </div>
      </div>
      <BottomNavClient />
      <InstallPwaPrompt />
    </>
  );
});

export function AppShellWrapper({
  children,
  leftSidebarBanner,
  userName,
  userImage,
  isLoggedIn,
  userRole,
  userChampionshipId,
  mobileLogoUrl,
  systemName = "BASEGOL",
}: Props) {
  const pathname = usePathname() ?? "/";
  const footer = <SiteFooterClient systemName={systemName} />;

  if (isAuthRoute(pathname)) {
    return (
      <div className="flex min-h-screen flex-col bg-pitch">
        <div className="flex-1">{children}</div>
        <SiteFooterClient systemName={systemName} className="border-line/50 bg-pitch/80" />
      </div>
    );
  }

  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  if (isPortalEntryRoute(pathname)) {
    return <div className="min-h-screen bg-pitch">{children}</div>;
  }

  const showPublicChrome = isPublicAppRoute(pathname);
  const showOperadorHeader =
    pathname.startsWith("/operador") || pathname.startsWith("/partida");

  if (!showPublicChrome && !showOperadorHeader) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex-1">{children}</div>
        {footer}
      </div>
    );
  }

  if (showOperadorHeader && !showPublicChrome) {
    return (
      <div className="flex min-h-screen flex-col">
        <PublicTopBar
          userName={userName}
          userImage={userImage}
          isLoggedIn={isLoggedIn}
          userRole={userRole}
          userChampionshipId={userChampionshipId}
          mobileLogoUrl={mobileLogoUrl}
        />
        <StaffPortalBar
          userRole={userRole}
          userChampionshipId={userChampionshipId}
          currentArea="operador"
        />
        <div className="flex flex-1 flex-col">
          {children}
          {footer}
        </div>
      </div>
    );
  }

  return (
    <PublicAppChrome
      leftSidebarBanner={leftSidebarBanner}
      userName={userName}
      userImage={userImage}
      isLoggedIn={isLoggedIn}
      userRole={userRole}
      userChampionshipId={userChampionshipId}
      mobileLogoUrl={mobileLogoUrl}
      systemName={systemName}
    >
      {children}
    </PublicAppChrome>
  );
}
