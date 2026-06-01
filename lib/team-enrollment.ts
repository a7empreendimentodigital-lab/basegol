import { prisma } from "@/lib/prisma";

/** Garante que o clube está inscrito no grupo (registro em `teams`). */
export async function ensureTeamInGroup(groupId: string, clubId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, name: true, categoryId: true },
  });
  if (!group) throw new Error("Grupo não encontrado");

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true, name: true },
  });
  if (!club) throw new Error("Clube não encontrado");

  const otherGroup = await prisma.team.findFirst({
    where: {
      clubId,
      groupId: { not: groupId },
      group: { categoryId: group.categoryId },
    },
    include: { group: { select: { name: true } } },
  });
  if (otherGroup) {
    throw new Error(
      `${club.name} já está inscrito em ${otherGroup.group.name} nesta categoria. Remova de lá antes de inscrever em ${group.name}.`
    );
  }

  return prisma.team.upsert({
    where: { clubId_groupId: { clubId, groupId } },
    create: { clubId, groupId },
    update: {},
    include: { club: { select: { id: true, name: true, crestUrl: true } } },
  });
}
