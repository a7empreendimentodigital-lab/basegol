import { normalizeRecordImageFields } from "@/lib/image-url";
import { getCachedActiveThemeConfig, getCachedBrandConfig } from "@/lib/server-cache";
import { prisma } from "@/lib/prisma";
import type { Sponsor } from "@prisma/client";

export async function getActiveThemeConfig() {
  return getCachedActiveThemeConfig();
}

export async function getBrandConfig() {
  return getCachedBrandConfig();
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
      brand,
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
