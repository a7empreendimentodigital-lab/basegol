"use client";

import { motion } from "framer-motion";

type BannerCarouselProps = {
  banners: { id: string; title: string; subtitle?: string | null; imageUrl: string; linkUrl?: string | null }[];
};

export function BannerCarousel({ banners }: BannerCarouselProps) {
  if (banners.length === 0) return null;

  return (
    <div className="grid gap-3">
      {banners.slice(0, 3).map((banner) => (
        <motion.a
          whileHover={{ scale: 1.01 }}
          key={banner.id}
          href={banner.linkUrl ?? "#"}
          className="glass-card overflow-hidden neon-hover"
        >
          <div className="h-40 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent p-4 flex flex-col justify-end">
              <p className="font-display text-2xl text-white">{banner.title}</p>
              {banner.subtitle ? <p className="text-xs text-muted-foreground">{banner.subtitle}</p> : null}
            </div>
          </div>
        </motion.a>
      ))}
    </div>
  );
}
