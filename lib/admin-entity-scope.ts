import { prisma } from "@/lib/prisma";

/** Resolve o campeonato de um grupo (categoria → campeonato). */
export async function getChampionshipIdForGroup(groupId: string): Promise<string | null> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { category: { select: { championshipId: true } } },
  });
  return group?.category.championshipId ?? null;
}

/** Garante que o grupo pertence a um dos campeonatos permitidos. */
export async function assertGroupInChampionships(
  groupId: string,
  allowedChampionshipIds: string[]
) {
  const championshipId = await getChampionshipIdForGroup(groupId);
  if (!championshipId || !allowedChampionshipIds.includes(championshipId)) {
    throw new Error("FORBIDDEN");
  }
  return championshipId;
}

/** Preenche championshipId em jogos criados/alterados manualmente no admin. */
export async function enrichMatchPayloadWithChampionshipId(
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const groupId = typeof payload.groupId === "string" ? payload.groupId : null;
  if (!groupId) return payload;
  const championshipId = await getChampionshipIdForGroup(groupId);
  if (championshipId) {
    return { ...payload, championshipId };
  }
  return payload;
}
