"use client";

import Image from "next/image";
import { bannerLinkProps } from "@/lib/banner-link";
import { bannerDisplaySize } from "@/lib/banner-specs";
import type { PublicBannerDto } from "@/services/banner.service";
import { cn } from "@/lib/utils";

type SidebarAdBannerProps = {
  banner: PublicBannerDto | null | undefined;
  variant: "left" | "right";
  className?: string;
};

export function SidebarAdBanner({ banner, variant, className }: SidebarAdBannerProps) {
  if (!banner?.imageUrl) return null;

  const link = bannerLinkProps(banner.linkUrl);
  const placement = variant === "left" ? "SIDEBAR_LEFT" : "SIDEBAR_RIGHT";
  const { width, height } = bannerDisplaySize(placement);

  const inner = (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl border border-line bg-graphite-light",
        className
      )}
      style={{ height: `${height}px`, maxWidth: `${width}px`, marginInline: "auto" }}
    >
      <Image
        src={banner.imageUrl}
        alt={banner.title}
        fill
        className="object-cover"
        sizes={`${width}px`}
        unoptimized={banner.imageUrl.startsWith("/uploads/")}
      />
    </div>
  );

  if (link.href) {
    return (
      <a
        {...link}
        className="block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-selected rounded-xl"
        aria-label={banner.title}
      >
        {inner}
      </a>
    );
  }

  return <div className="w-full">{inner}</div>;
}
