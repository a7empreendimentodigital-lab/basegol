import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const SYSTEM_ROLES: Record<
  string,
  { name: string; description?: string; permissions: Prisma.InputJsonValue }
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

  const existing = await prisma.role.findUnique({ where: { slug } });
  if (existing) return existing;

  return prisma.role.create({
    data: {
      slug,
      name: def.name,
      description: def.description,
      permissions: def.permissions,
    },
  });
}
