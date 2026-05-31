"use client";

import { SafeImage } from "@/components/ui/SafeImage";
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
  const isLeft = variant === "left";

  const inner = (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl",
        /* Mobile: largura total e mais alto */
        isLeft ? "aspect-[264/320] min-h-[240px]" : "aspect-[268/250] min-h-[260px] sm:min-h-[300px]",
        "max-md:max-w-none",
        /* Desktop: tamanho da arte cadastrada */
        "md:aspect-auto md:min-h-0 md:mx-auto",
        isLeft ? "md:max-w-[264px] md:h-[320px]" : "md:max-w-[268px] md:h-[250px]",
        className
      )}
    >
      <SafeImage
        src={banner.imageUrl}
        alt={banner.title}
        fill
        className="object-cover"
        sizes={`(max-width: 768px) 100vw, ${width}px`}
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
