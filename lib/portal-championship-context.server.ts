import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  normalizePortalChampionshipSlug,
  portalChampionshipCookieOptions,
  PORTAL_CHAMPIONSHIP_COOKIE,
} from "@/lib/portal-championship-slug";

export async function getServerPortalChampionshipSlug(): Promise<string | null> {
  const store = await cookies();
  const fromCookie = normalizePortalChampionshipSlug(
    store.get(PORTAL_CHAMPIONSHIP_COOKIE)?.value
  );
  if (fromCookie) return fromCookie;

  const session = await getServerSession(authOptions);
  const championshipId = session?.user?.championshipId;
  if (!championshipId) return null;

  const championship = await prisma.championship.findUnique({
    where: { id: championshipId },
    select: { slug: true },
  });
  return championship?.slug ?? null;
}

export async function persistServerPortalChampionshipSlug(slug: string) {
  const normalized = normalizePortalChampionshipSlug(slug);
  if (!normalized) return;
  const store = await cookies();
  store.set(portalChampionshipCookieOptions(normalized));
}
