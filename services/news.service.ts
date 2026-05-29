import { prisma } from "@/lib/prisma";
import type { NewsItem } from "@/types";

export async function getFeaturedNews(): Promise<NewsItem[]> {
  try {
    const items = await prisma.news.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      take: 6,
    });
    return items;
  } catch {
    return [];
  }
}

export async function getNewsBySlug(slug: string) {
  try {
    return await prisma.news.findUnique({ where: { slug } });
  } catch {
    return null;
  }
}
