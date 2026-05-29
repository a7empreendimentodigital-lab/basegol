/**
 * Filtro `contains` para listagens com busca.
 * MySQL não aceita `mode: "insensitive"` no Prisma (apenas PostgreSQL/MongoDB).
 * Com collation utf8mb4_*_ci, o LIKE já ignora maiúsculas/minúsculas.
 */
export function prismaContains(value: string) {
  return { contains: value };
}
