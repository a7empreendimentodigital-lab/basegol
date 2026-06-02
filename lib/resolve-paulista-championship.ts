import { prisma } from "@/lib/prisma";

export async function resolveDefaultPaulistaChampionshipId(): Promise<{
  id: string;
  name: string;
}> {
  const championships = await prisma.championship.findMany({
    where: { status: { in: ["ACTIVE", "REGISTRATION"] } },
    include: {
      categories: { where: { status: "ACTIVE" }, select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const paulista =
    championships.find(
      (c) =>
        c.name.toLowerCase().includes("paulista") &&
        (c.season === "2026" || c.season.includes("2026"))
    ) ??
    championships.find((c) =>
      c.categories.some((cat) => /sub-?1[12]/i.test(cat.name))
    ) ??
    championships[0];

  if (!paulista) {
    throw new Error(
      "Nenhum campeonato ativo encontrado. Cadastre o Campeonato Paulista de Base 2026 no admin."
    );
  }

  return { id: paulista.id, name: paulista.name };
}
