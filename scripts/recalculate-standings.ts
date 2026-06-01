/**
 * Recalcula classificação por grupo/categoria/campeonato.
 *
 * Uso (um dos):
 *   npx tsx scripts/recalculate-standings.ts --group <groupId>
 *   npx tsx scripts/recalculate-standings.ts --category <categoryId>
 *   npx tsx scripts/recalculate-standings.ts --championship <championshipId>
 */
import {
  recalculateStandingsForCategory,
  recalculateStandingsForChampionship,
  recalculateStandingsForGroup,
} from "@/services/standings.service";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const groupId = arg("--group");
  const categoryId = arg("--category");
  const championshipId = arg("--championship");

  if (groupId) {
    const r = await recalculateStandingsForGroup(groupId);
    console.log(JSON.stringify(r, null, 2));
    return;
  }
  if (categoryId) {
    const r = await recalculateStandingsForCategory(categoryId);
    console.log(JSON.stringify(r, null, 2));
    return;
  }
  if (championshipId) {
    const r = await recalculateStandingsForChampionship(championshipId);
    console.log(JSON.stringify(r, null, 2));
    return;
  }

  console.error(
    "Informe --group <id>, --category <id> ou --championship <id>"
  );
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
