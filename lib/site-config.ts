import { normalizeBrandConfig, normalizeRecordImageFields } from "@/lib/image-url";
import { prisma } from "@/lib/prisma";
import type { Sponsor } from "@prisma/client";

export async function getActiveThemeConfig() {
  try {
    return await prisma.themeConfig.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });
  } catch {
    return null;
  }
}

export async function getBrandConfig() {
  try {
    const brand = await prisma.brandConfig.findFirst({ orderBy: { updatedAt: "desc" } });
    return brand ? normalizeBrandConfig(brand) : null;
  } catch {
    return null;
  }
}

export async function getPublicSiteConfig() {
  try {
    const [brand, theme, sponsors, sections, texts, menu] = await Promise.all([
      getBrandConfig(),
      getActiveThemeConfig(),
      prisma.sponsor.findMany({ where: { isActive: true }, orderBy: { order: "asc" }, take: 20 }),
      prisma.siteSection.findMany({ where: { isActive: true }, orderBy: { order: "asc" }, take: 50 }),
      prisma.siteText.findMany({ where: { locale: "pt-BR" }, take: 200 }),
      prisma.menuItem.findMany({ where: { area: "PUBLIC", isActive: true }, orderBy: { order: "asc" } }),
    ]);
    return {
      brand: brand ? normalizeBrandConfig(brand) : null,
      theme,
      sponsors: sponsors.map((s) => normalizeRecordImageFields(s as Sponsor)),
      sections,
      texts,
      menu,
    };
  } catch {
    return {
      brand: null,
      theme: null,
      sponsors: [],
      sections: [],
      texts: [],
      menu: [],
    };
  }
}
