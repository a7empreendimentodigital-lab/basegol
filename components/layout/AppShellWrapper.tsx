"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNavClient } from "@/components/layout/BottomNavClient";
import { PublicTopBar } from "@/components/layout/PublicTopBar";
import { InstallPwaPrompt } from "@/components/pwa/InstallPwaPrompt";
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
    return <div className="min-h-screen bg-pitch">{children}</div>;
  }

  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  const showPublicChrome = isPublicAppRoute(pathname);

  return (
    <>
      {showPublicChrome && <Sidebar leftBanner={leftSidebarBanner} isLoggedIn={isLoggedIn} />}
      <div
        className={
          showPublicChrome
            ? "flex min-h-screen flex-col pb-16 md:pb-0 md:pl-64 lg:pl-72"
            : "flex min-h-screen flex-col"
        }
      >
        {showPublicChrome && (
          <PublicTopBar
            userName={userName}
            userImage={userImage}
            isLoggedIn={isLoggedIn}
            mobileLogoUrl={mobileLogoUrl}
          />
        )}
        <div key={pathname}>{children}</div>
      </div>
      {showPublicChrome && <BottomNavClient />}
      {showPublicChrome && <InstallPwaPrompt />}
    </>
  );
}
