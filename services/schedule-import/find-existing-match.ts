import { prisma } from "@/lib/prisma";
import {
  buildLegacyMatchImportFingerprint,
  buildMatchImportFingerprint,
  type MatchFingerprintInput,
} from "@/lib/match-import-fingerprint";

export async function findExistingImportedMatch(
  input: MatchFingerprintInput & { categoryId: string }
) {
  const fingerprint = buildMatchImportFingerprint(input);
  const byFingerprint = await prisma.match.findUnique({
    where: { importFingerprint: fingerprint },
  });
  if (byFingerprint) return byFingerprint;

  const legacyFingerprint = buildLegacyMatchImportFingerprint(input);
  const byLegacy = await prisma.match.findUnique({
    where: { importFingerprint: legacyFingerprint },
  });
  if (byLegacy) return byLegacy;

  return prisma.match.findFirst({
    where: {
      championshipId: input.championshipId,
      scheduledAt: input.scheduledAt,
      homeClubId: input.homeClubId,
      awayClubId: input.awayClubId,
      group: { categoryId: input.categoryId },
    },
  });
}
