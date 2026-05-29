import { prisma } from "@/lib/prisma";
import {
  distinctiveClubOverlap,
  formatClubDisplayName,
  isLikelySameClub,
  normalizeClubName,
} from "@/lib/normalize-name";
import type { ClubNameResolver } from "@/services/schedule-import/fp-paulista-parser";

export function pickCanonicalClubName(a: string, b: string): string {
  const fa = formatClubDisplayName(a);
  const fb = formatClubDisplayName(b);
  return fa.length >= fb.length ? fa : fb;
}

export async function findExistingClub(
  rawName: string,
  resolver?: ClubNameResolver
): Promise<{ id: string; name: string } | null> {
  const resolved = resolver ? formatClubDisplayName(resolver.resolve(rawName)) : null;
  const candidates = [...new Set([resolved, formatClubDisplayName(rawName)].filter(Boolean))] as string[];

  for (const name of candidates) {
    const normalizedName = normalizeClubName(name);
    const exact = await prisma.club.findUnique({
      where: { normalizedName },
      select: { id: true, name: true },
    });
    if (exact) return exact;
  }

  const clubs = await prisma.club.findMany({
    select: { id: true, name: true, normalizedName: true },
  });

  let best: { id: string; name: string; score: number } | null = null;

  for (const club of clubs) {
    for (const name of candidates) {
      if (!isLikelySameClub(name, club.name)) continue;
      const score = distinctiveClubOverlap(name, club.name) + club.name.length / 1000;
      if (!best || score > best.score) {
        best = { id: club.id, name: club.name, score };
      }
    }
  }

  return best ? { id: best.id, name: best.name } : null;
}
