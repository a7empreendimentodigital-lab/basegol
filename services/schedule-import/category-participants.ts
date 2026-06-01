import { buildClubAliasKeys } from "@/lib/match-import-fingerprint";
import { prisma } from "@/lib/prisma";
import type { ParsedParticipantClub } from "@/services/schedule-import/fp-paulista-parser";

/** Carrega clubes/grupos já cadastrados na categoria (para importar jogos sem recriar participantes). */
export async function loadParticipantsFromCategory(
  categoryId: string
): Promise<ParsedParticipantClub[]> {
  const teams = await prisma.team.findMany({
    where: { group: { categoryId } },
    include: {
      club: { select: { name: true, city: true } },
      group: { select: { name: true } },
    },
  });

  const byClub = new Map<string, ParsedParticipantClub>();
  for (const t of teams) {
    const key = t.club.name;
    if (!byClub.has(key)) {
      byClub.set(key, {
        fullName: t.club.name,
        city: t.club.city ?? undefined,
        groupName: t.group.name,
        aliases: buildClubAliasKeys(t.club.name),
      });
    }
  }
  return [...byClub.values()];
}
