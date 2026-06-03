import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Prisma as PrismaTypes } from "@prisma/client";

const SYSTEM_ROLES: Record<
  string,
  { name: string; description?: string; permissions: PrismaTypes.InputJsonValue }
> = {
  ADMIN_CAMPEONATO: {
    name: "Admin do Campeonato",
    description: "Gestão de um campeonato específico",
    permissions: [
      "championship:scoped:*",
      "club:*",
      "match:*",
      "news:*",
      "standing:*",
      "sponsor:scoped:*",
      "user:scoped:read",
    ],
  },
  OPERADOR_DE_PARTIDA: {
    name: "Operador de Partida",
    description: "Placar ao vivo das partidas liberadas",
    permissions: [
      "match:update-live",
      "match:event:*",
      "match:stat:*",
      "match:lifecycle:*",
    ],
  },
};

/** Garante que papéis usados no admin existem (produção sem seed completo). */
export async function ensureSystemRole(slug: string) {
  const def = SYSTEM_ROLES[slug];
  if (!def) {
    return prisma.role.findUnique({ where: { slug } });
  }

  const bySlug = await prisma.role.findUnique({ where: { slug } });
  if (bySlug) return bySlug;

  const byName = await prisma.role.findFirst({ where: { name: def.name } });
  if (byName) {
    if (byName.slug !== slug) {
      return prisma.role.update({
        where: { id: byName.id },
        data: {
          slug,
          description: def.description,
          permissions: def.permissions,
        },
      });
    }
    return byName;
  }

  try {
    return await prisma.role.create({
      data: {
        slug,
        name: def.name,
        description: def.description,
        permissions: def.permissions,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const again = await prisma.role.findUnique({ where: { slug } });
      if (again) return again;
    }
    throw error;
  }
}
