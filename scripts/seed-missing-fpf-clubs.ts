/**
 * Cadastra ou corrige clubes da lista oficial FPF (79 participantes).
 * Uso: npx tsx scripts/seed-missing-fpf-clubs.ts
 */
import { syncFpfClubsFromCsv } from "@/services/fpf-clubs-seed.service";
import { syncGroupTeamsFromDefaultCsv } from "@/services/group-roster-sync.service";
import { prisma } from "@/lib/prisma";

async function main() {
  const clubs = await syncFpfClubsFromCsv();
  console.log(JSON.stringify(clubs, null, 2));

  if (clubs.stillMissing.length === 0) {
    console.log("\nSincronizando grupos...");
    const groups = await syncGroupTeamsFromDefaultCsv();
    console.log(JSON.stringify(groups, null, 2));
  } else {
    console.warn("\nAinda faltam clubes; grupos não foram sincronizados.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
