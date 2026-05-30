import { unstable_cache } from "next/cache";
import { normalizeBrandConfig } from "@/lib/image-url";
import { prisma } from "@/lib/prisma";

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
  { revalidate: 120 }
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
