import { unstable_cache } from "next/cache";
import { normalizeBrandConfig, normalizeImageSrc } from "@/lib/image-url";
import { prisma } from "@/lib/prisma";
import type { BannerPlacement } from "@prisma/client";

function activeBannerWhere(placement: BannerPlacement) {
  const now = new Date();
  return {
    isActive: true,
    placement,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      {
        OR: [
          { endsAt: null },
          { endsAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } },
        ],
      },
    ],
  };
}

export const getCachedBrandConfig = unstable_cache(
  async () => {
    try {
      const brand = await prisma.brandConfig.findFirst({ orderBy: { updatedAt: "desc" } });
      return brand ? normalizeBrandConfig(brand) : null;
    } catch {
      return null;
    }
  },
  ["brand-config"],
  { revalidate: 120, tags: ["brand-config"] }
);

export const getCachedActiveThemeConfig = unstable_cache(
  async () => {
    try {
      return await prisma.themeConfig.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: "desc" },
      });
    } catch {
      return null;
    }
  },
  ["active-theme"],
  { revalidate: 120 }
);

export const getCachedSidebarLeftBanner = unstable_cache(
  async () => {
    try {
      const banner = await prisma.banner.findFirst({
        where: activeBannerWhere("SIDEBAR_LEFT"),
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      });
      if (!banner) return null;
      return {
        id: banner.id,
        title: banner.title,
        subtitle: banner.subtitle,
        imageUrl: normalizeImageSrc(banner.imageUrl) ?? banner.imageUrl,
        linkUrl: banner.linkUrl,
        placement: banner.placement,
        order: banner.order,
      };
    } catch {
      return null;
    }
  },
  ["sidebar-left-banner"],
  { revalidate: 60, tags: ["sidebar-left-banner"] }
);
