/**
 * Remove inscrições duplicadas usando group_teams oficial do pacote FPF.
 * Mantém o grupo correto; remove o clube dos demais grupos (com jogos, se --force).
 *
 * Uso:
 *   npx tsx scripts/fix-duplicate-group-teams-from-fpf.ts <pasta_ou_json> [--dry-run] [--force]
 */
import { findExistingClub } from "@/lib/club-lookup";
import { normalizeAthleteCategory } from "@/lib/athlete-category";
import { prisma } from "@/lib/prisma";
import { formatPaulistaGroupName } from "@/services/paulista-pack-import/paulista-pack-convert";
import { loadPaulistaPack } from "@/services/paulista-pack-import/paulista-pack-loader";
import { removeTeamFromGroup } from "@/services/group-team-admin.service";

async function main() {
  const source = process.argv[2];
  const dryRun = process.argv.includes("--dry-run");
  const force = process.argv.includes("--force") || !dryRun;

  if (!source) {
    console.error(
      "Uso: npx tsx scripts/fix-duplicate-group-teams-from-fpf.ts <pasta_ou_json> [--dry-run] [--force]"
    );
    process.exit(1);
  }

  const pack = loadPaulistaPack(source);
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
  });

  let removed = 0;
  let skipped = 0;

  for (const gt of pack.groupTeams) {
    const catHint = normalizeAthleteCategory(gt.competition_category);
    const category = categories.find((c) => normalizeAthleteCategory(c.name) === catHint);
    if (!category) {
      skipped += 1;
      continue;
    }

    const club = await findExistingClub(gt.official_name);
    if (!club) {
      console.warn(`Clube não encontrado: ${gt.official_name}`);
      skipped += 1;
      continue;
    }

    const canonicalGroupName = formatPaulistaGroupName(gt.group);
    const teams = await prisma.team.findMany({
      where: { clubId: club.id, group: { categoryId: category.id } },
      include: { group: { select: { id: true, name: true } } },
    });

    if (teams.length <= 1) continue;

    const keep =
      teams.find((t) => t.group.name === canonicalGroupName) ??
      teams.sort((a, b) => a.group.name.localeCompare(b.group.name))[0];

    for (const t of teams) {
      if (t.id === keep.id) continue;
      console.log(
        `${dryRun ? "[dry-run] " : ""}Remover ${club.name} de ${t.group.name} (fica em ${keep.group.name}) — ${catHint}`
      );
      if (!dryRun) {
        await removeTeamFromGroup(t.group.id, t.id, { force });
      }
      removed += 1;
    }
  }

  console.log(`\nRemoções${dryRun ? " (simuladas)" : ""}: ${removed}`);
  console.log(`Ignorados (categoria/clube): ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
