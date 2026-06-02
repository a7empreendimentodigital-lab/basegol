/**
 * Sincroniza inscrições de clubes nos grupos conforme lista oficial FPF (CSV no repositório).
 *
 * Uso:
 *   npm run sync:group-roster
 *   npm run sync:group-roster -- --dry-run
 *   npm run sync:group-roster -- --category Sub-12
 *   npx tsx scripts/sync-group-teams-from-roster.ts ~/Downloads/basegol_paulista_import_2026
 */
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { normalizeAthleteCategory } from "@/lib/athlete-category";
import {
  syncGroupTeamsFromDefaultCsv,
  syncGroupTeamsFromPackDir,
} from "@/services/group-roster-sync.service";

const dryRun = process.argv.includes("--dry-run");
const categoryFilter = (() => {
  const i = process.argv.indexOf("--category");
  return i >= 0 ? normalizeAthleteCategory(process.argv[i + 1]) : null;
})();

const source = process.argv.find((a, i) => i >= 2 && !a.startsWith("--"));

async function main() {
  const result = source
    ? await syncGroupTeamsFromPackDir(path.resolve(source), {
        categoryFilter,
        dryRun,
      })
    : await syncGroupTeamsFromDefaultCsv({ categoryFilter, dryRun });

  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
