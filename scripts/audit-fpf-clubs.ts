/**
 * Compara clubes oficiais FPF (group_teams.csv) com o cadastro no banco.
 * Uso: npx tsx scripts/audit-fpf-clubs.ts
 */
import { readFileSync } from "node:fs";
import { parseGroupTeamsCsv } from "@/services/paulista-pack-import/paulista-pack-loader";
import { prisma } from "@/lib/prisma";
import { normalizeClubName } from "@/lib/normalize-name";
import { resolveClubByOfficialName } from "@/services/group-roster-sync.service";

async function main() {
  const roster = parseGroupTeamsCsv(readFileSync("data/fpf-2026/group_teams.csv"));
  const officialUnique = [...new Set(roster.map((r) => r.official_name))].sort();

  console.log("Oficial CSV (únicos):", officialUnique.length);
  console.log("Banco total:", await prisma.club.count());

  const missing: string[] = [];
  const mapped = new Map<string, string>();

  for (const name of officialUnique) {
    const club = await resolveClubByOfficialName(name);
    if (!club) missing.push(name);
    else mapped.set(name, club.id);
  }

  console.log("\nFaltando (", missing.length, "):");
  missing.forEach((n) => console.log(" -", n));

  const officialClubIds = new Set(mapped.values());
  const dbClubs = await prisma.club.findMany({
    select: { id: true, name: true, status: true },
    orderBy: { name: "asc" },
  });

  const extra = dbClubs.filter((c) => !officialClubIds.has(c.id));
  console.log("\nNo banco fora da lista FPF (", extra.length, "):");
  extra.forEach((c) => console.log(` - ${c.name} [${c.status}]`));

  const dupes = new Map<string, string[]>();
  for (const [official, id] of mapped) {
    if (!dupes.has(id)) dupes.set(id, []);
    dupes.get(id)!.push(official);
  }
  const multi = [...dupes.entries()].filter(([, names]) => names.length > 1);
  if (multi.length) {
    console.log("\nVários nomes oficiais → mesmo clube:");
    for (const [id, names] of multi) {
      const c = dbClubs.find((x) => x.id === id);
      console.log(` - ${c?.name}: ${names.join(" | ")}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
