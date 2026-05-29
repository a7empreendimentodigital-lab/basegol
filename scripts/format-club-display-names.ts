/**
 * Converte nomes de clubes em MAIÚSCULAS para caixa normal.
 * Uso: npx tsx scripts/format-club-display-names.ts
 */
import { PrismaClient } from "@prisma/client";
import { formatClubDisplayName, isMostlyUppercase } from "../lib/normalize-name";

const prisma = new PrismaClient();

async function main() {
  const clubs = await prisma.club.findMany({
    select: { id: true, name: true, city: true, shortName: true },
  });

  let updated = 0;
  for (const club of clubs) {
    const name = formatClubDisplayName(club.name);
    const city = club.city && isMostlyUppercase(club.city) ? formatClubDisplayName(club.city) : club.city;
    const shortName =
      club.shortName && isMostlyUppercase(club.shortName)
        ? formatClubDisplayName(club.shortName)
        : club.shortName;

    if (name === club.name && city === club.city && shortName === club.shortName) continue;

    await prisma.club.update({
      where: { id: club.id },
      data: { name, city, shortName },
    });
    console.log(`${club.name} → ${name}`);
    updated++;
  }

  console.log(`\n${updated} clubes atualizados de ${clubs.length}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
