/**
 * Prepara clubes existentes antes de aplicar unique em normalizedName.
 * Uso: npx tsx scripts/backfill-club-normalized-names.ts
 */
import { PrismaClient } from "@prisma/client";
import { normalizeClubName } from "../lib/normalize-name";

const prisma = new PrismaClient();

async function main() {
  const clubs = await prisma.$queryRaw<{ id: string; name: string }[]>`
    SELECT id, name FROM clubs
  `;

  const used = new Map<string, string>();
  for (const club of clubs) {
    let key = normalizeClubName(club.name);
    if (used.has(key) && used.get(key) !== club.id) {
      key = `${key}-${club.id.slice(0, 6)}`;
    }
    used.set(key, club.id);
    await prisma.$executeRaw`
      UPDATE clubs SET normalizedName = ${key} WHERE id = ${club.id}
    `;
  }
  console.log(`Atualizados ${clubs.length} clubes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
