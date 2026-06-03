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

export async function getChampionshipIdBySlug(slug: string) {
  const row = await prisma.championship.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });
  return row;
}

export async function recordChampionshipSponsorImpression(
  championshipSlug: string,
  sponsorId: string
) {
  const championship = await getChampionshipIdBySlug(championshipSlug);
  if (!championship) return false;

  const updated = await prisma.championshipSponsor.updateMany({
    where: { id: sponsorId, championshipId: championship.id, isActive: true },
    data: {
      impressionCount: { increment: 1 },
      lastImpressionAt: new Date(),
    },
  });
  return updated.count > 0;
}

export async function recordChampionshipSponsorClick(
  championshipSlug: string,
  sponsorId: string
) {
  const championship = await getChampionshipIdBySlug(championshipSlug);
  if (!championship) return false;

  const updated = await prisma.championshipSponsor.updateMany({
    where: { id: sponsorId, championshipId: championship.id, isActive: true },
    data: {
      clickCount: { increment: 1 },
      lastClickAt: new Date(),
    },
  });
  return updated.count > 0;
}

export async function reorderChampionshipSponsors(
  championshipId: string,
  orderedIds: string[]
) {
  const existing = await prisma.championshipSponsor.findMany({
    where: { championshipId },
    select: { id: true },
  });
  const valid = new Set(existing.map((e) => e.id));
  if (orderedIds.some((id) => !valid.has(id))) {
    throw new Error("INVALID_ORDER");
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.championshipSponsor.update({
        where: { id },
        data: { order: index },
      })
    )
  );
}
