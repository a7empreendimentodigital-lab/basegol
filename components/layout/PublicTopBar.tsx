"use client";

import { usePathname } from "next/navigation";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { isAuthRoute, isPublicAppRoute } from "@/lib/public-routes";

type Props = {
  userName?: string | null;
  userImage?: string | null;
  isLoggedIn?: boolean;
  mobileLogoUrl?: string | null;
};

export function PublicTopBar({ userName, userImage, isLoggedIn, mobileLogoUrl }: Props) {
  const pathname = usePathname() ?? "/";

  if (isAuthRoute(pathname)) {
    return null;
  }

  if (!isPublicAppRoute(pathname) && !pathname.startsWith("/operador")) {
    return null;
  }

  return (
    <PublicHeader
      userName={userName}
      userImage={userImage}
      isLoggedIn={isLoggedIn}
      mobileLogoUrl={mobileLogoUrl}
    />
  );
}
