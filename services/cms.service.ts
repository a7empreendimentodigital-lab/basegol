import { prisma } from "@/lib/prisma";

export async function getCmsBundle() {
  const [theme, brand, sponsors, sections, texts, menu, banners] = await Promise.all([
    prisma.themeConfig.findFirst({ where: { isActive: true }, orderBy: { updatedAt: "desc" } }),
    prisma.brandConfig.findFirst({ orderBy: { updatedAt: "desc" } }),
    prisma.sponsor.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    prisma.siteSection.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    prisma.siteText.findMany({ where: { locale: "pt-BR" } }),
    prisma.menuItem.findMany({ where: { area: "PUBLIC", isActive: true }, orderBy: { order: "asc" } }),
    prisma.banner.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
  ]);

  return { theme, brand, sponsors, sections, texts, menu, banners };
}

export async function updateThemeConfig(id: string, data: Partial<{
  name: string;
  isActive: boolean;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  cardColor: string;
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
}>) {
  return prisma.themeConfig.update({ where: { id }, data });
}

export async function upsertBrandConfig(data: Partial<{
  systemName: string;
  slogan: string;
  logoUrl: string;
  mobileLogoUrl: string;
  faviconUrl: string;
  splashScreenUrl: string;
  loginBackgroundUrl: string;
  homeHeroBackgroundUrl: string;
}>) {
  const current = await prisma.brandConfig.findFirst({ orderBy: { updatedAt: "desc" } });
  if (!current) return prisma.brandConfig.create({ data: { systemName: "BASEGOL", ...data } });
  return prisma.brandConfig.update({ where: { id: current.id }, data });
}
