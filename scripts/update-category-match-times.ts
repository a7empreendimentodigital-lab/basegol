/**
 * Atualiza horários dos jogos: Sub-11 → 14:30, Sub-12 → 16:00 (America/Sao_Paulo).
 *
 * Uso:
 *   npx tsx scripts/update-category-match-times.ts
 *   npx tsx scripts/update-category-match-times.ts --dry-run
 */
import { normalizeAthleteCategory } from "@/lib/athlete-category";
import {
  applyCategoryMatchTime,
  CATEGORY_MATCH_TIMES,
} from "@/lib/category-match-times";
import { prisma } from "@/lib/prisma";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
  });

  const targets = categories.filter((c) => {
    const norm = normalizeAthleteCategory(c.name);
    return norm in CATEGORY_MATCH_TIMES;
  });

  if (targets.length === 0) {
    console.log("Nenhuma categoria Sub-11/Sub-12 encontrada.");
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const cat of targets) {
    const norm = normalizeAthleteCategory(cat.name);
    const slot = CATEGORY_MATCH_TIMES[norm];
    const matches = await prisma.match.findMany({
      where: { group: { categoryId: cat.id } },
      select: { id: true, scheduledAt: true },
    });

    console.log(`\n${cat.name} (${norm}) → ${String(slot.hour).padStart(2, "0")}:${String(slot.minute).padStart(2, "0")} — ${matches.length} jogos`);

    for (const match of matches) {
      const next = applyCategoryMatchTime(match.scheduledAt, cat.name);
      if (next.getTime() === match.scheduledAt.getTime()) {
        skipped += 1;
        continue;
      }
      if (!dryRun) {
        await prisma.match.update({
          where: { id: match.id },
          data: { scheduledAt: next },
        });
      }
      updated += 1;
    }
  }

  console.log(
    dryRun
      ? `\n[dry-run] Seriam atualizados: ${updated}, já corretos: ${skipped}`
      : `\nAtualizados: ${updated}, já corretos: ${skipped}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
