import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolvePortalChampionshipSlug } from "@/lib/portal-championship-scope";
import {
  normalizePortalChampionshipSlug,
  PORTAL_CHAMPIONSHIP_COOKIE,
} from "@/lib/portal-championship-slug";

export async function getServerPortalChampionshipSlug(
  explicitPathname?: string
): Promise<string | null> {
  const store = await cookies();
  const cookieSlug = normalizePortalChampionshipSlug(
    store.get(PORTAL_CHAMPIONSHIP_COOKIE)?.value
  );

  const pathname =
    explicitPathname ?? (await headers()).get("x-pathname") ?? "";

  if (pathname) {
    return resolvePortalChampionshipSlug(pathname, cookieSlug);
  }

  if (cookieSlug) return cookieSlug;

  const session = await getServerSession(authOptions);
  const championshipId = session?.user?.championshipId;
  if (!championshipId) return null;

  const championship = await prisma.championship.findUnique({
    where: { id: championshipId },
    select: { slug: true },
  });
  return championship?.slug ?? null;
}
