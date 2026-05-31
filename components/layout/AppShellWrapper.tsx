"use client";

import { memo } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNavClient } from "@/components/layout/BottomNavClient";
import { PublicTopBar } from "@/components/layout/PublicTopBar";
import { InstallPwaPrompt } from "@/components/pwa/InstallPwaPrompt";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { isAuthRoute, isPublicAppRoute } from "@/lib/public-routes";
import type { PublicBannerDto } from "@/services/banner.service";

type Props = {
  children: React.ReactNode;
  leftSidebarBanner?: PublicBannerDto | null;
  userName?: string | null;
  userImage?: string | null;
  isLoggedIn?: boolean;
  mobileLogoUrl?: string | null;
};

type PublicChromeProps = {
  children: React.ReactNode;
  leftSidebarBanner?: PublicBannerDto | null;
  userName?: string | null;
  userImage?: string | null;
  isLoggedIn?: boolean;
  mobileLogoUrl?: string | null;
};

const PublicAppChrome = memo(function PublicAppChrome({
  children,
  leftSidebarBanner,
  userName,
  userImage,
  isLoggedIn,
  mobileLogoUrl,
}: PublicChromeProps) {
  return (
    <>
      <Sidebar leftBanner={leftSidebarBanner} isLoggedIn={isLoggedIn} />
      <div className="flex min-h-screen flex-col pb-16 md:pb-0 md:pl-64 lg:pl-72">
        <PublicTopBar
          userName={userName}
          userImage={userImage}
          isLoggedIn={isLoggedIn}
          mobileLogoUrl={mobileLogoUrl}
        />
        {children}
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
  mobileLogoUrl,
}: Props) {
  const pathname = usePathname() ?? "/";

  if (isAuthRoute(pathname)) {
    return (
      <div className="flex min-h-screen flex-col bg-pitch">
        <div className="flex-1">{children}</div>
        <SiteFooter className="border-line/50 bg-pitch/80" />
      </div>
    );
  }

  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  const showPublicChrome = isPublicAppRoute(pathname);
  const showOperadorHeader = pathname.startsWith("/operador");

  if (!showPublicChrome && !showOperadorHeader) {
    return <div className="flex min-h-screen flex-col">{children}</div>;
  }

  if (showOperadorHeader && !showPublicChrome) {
    return (
      <div className="flex min-h-screen flex-col">
        <PublicTopBar
          userName={userName}
          userImage={userImage}
          isLoggedIn={isLoggedIn}
          mobileLogoUrl={mobileLogoUrl}
        />
        {children}
      </div>
    );
  }

  return (
    <PublicAppChrome
      leftSidebarBanner={leftSidebarBanner}
      userName={userName}
      userImage={userImage}
      isLoggedIn={isLoggedIn}
      mobileLogoUrl={mobileLogoUrl}
    >
      {children}
    </PublicAppChrome>
  );
}
