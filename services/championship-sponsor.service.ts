import type { ChampionshipSponsorPlacement } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ChampionshipSponsorDto = {
  id: string;
  championshipId: string;
  name: string;
  logoUrl: string | null;
  linkUrl: string | null;
  placement: ChampionshipSponsorPlacement;
  order: number;
  isActive: boolean;
};

export async function listChampionshipSponsorsAdmin(championshipId: string) {
  return prisma.championshipSponsor.findMany({
    where: { championshipId },
    orderBy: [{ placement: "asc" }, { order: "asc" }, { name: "asc" }],
  });
}

export async function getActiveChampionshipSponsorsBySlug(
  slug: string,
  placement: ChampionshipSponsorPlacement
): Promise<ChampionshipSponsorDto[]> {
  const championship = await prisma.championship.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!championship) return [];

  const items = await prisma.championshipSponsor.findMany({
    where: {
      championshipId: championship.id,
      placement,
      isActive: true,
    },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      championshipId: true,
      name: true,
      logoUrl: true,
      linkUrl: true,
      placement: true,
      order: true,
      isActive: true,
    },
  });
  return items;
}
