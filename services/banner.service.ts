import { normalizeImageSrc } from "@/lib/image-url";
import { prisma } from "@/lib/prisma";
import type { BannerPlacement } from "@prisma/client";

export type PublicBannerDto = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  placement: BannerPlacement;
  order: number;
};

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
          // Inclui o dia final inteiro (admin grava só a data, ex.: fim em 29/05)
          { endsAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } },
        ],
      },
    ],
  };
}

export async function getActiveBannersByPlacement(
  placement: BannerPlacement
): Promise<PublicBannerDto[]> {
  try {
    const items = await prisma.banner.findMany({
      where: activeBannerWhere(placement),
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    return items.map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      imageUrl: normalizeImageSrc(b.imageUrl) ?? b.imageUrl,
      linkUrl: b.linkUrl,
      placement: b.placement,
      order: b.order,
    }));
  } catch {
    return [];
  }
}

export async function getHomeBanners() {
  const [hero, sidebarLeft, sidebarRight] = await Promise.all([
    getActiveBannersByPlacement("HERO_CAROUSEL"),
    getActiveBannersByPlacement("SIDEBAR_LEFT"),
    getActiveBannersByPlacement("SIDEBAR_RIGHT"),
  ]);
  return { hero, sidebarLeft, sidebarRight };
}
