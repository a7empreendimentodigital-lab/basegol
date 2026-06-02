/**
 * Sincroniza inscrições de clubes nos grupos conforme PDF de participantes ou group_teams.csv.
 *
 * Uso:
 *   npx tsx scripts/sync-group-teams-from-roster.ts <pdf_ou_pasta_pack> [--dry-run] [--category Sub-11]
 *   npx tsx scripts/sync-group-teams-from-roster.ts "/Users/.../Downloads/Sub-11-1-2.pdf"
 */
import fs from "node:fs";
import path from "node:path";
import { findExistingClub } from "@/lib/club-lookup";
import { normalizeAthleteCategory } from "@/lib/athlete-category";
import { ensureTeamInGroup } from "@/lib/team-enrollment";
import { prisma } from "@/lib/prisma";
import { extractTextFromPdf } from "@/services/schedule-import/pdf-text";
import { parseParticipantsPdfText } from "@/services/schedule-import/participants-pdf-parser";
import { formatPaulistaGroupName } from "@/services/paulista-pack-import/paulista-pack-convert";
import { loadPaulistaPack } from "@/services/paulista-pack-import/paulista-pack-loader";
import type { PaulistaGroupTeam } from "@/services/paulista-pack-import/paulista-pack.types";
import { removeTeamFromGroup } from "@/services/group-team-admin.service";
import { recalculateStandingsForCategory } from "@/services/standings.service";

const dryRun = process.argv.includes("--dry-run");
const categoryFilter = (() => {
  const i = process.argv.indexOf("--category");
  return i >= 0 ? normalizeAthleteCategory(process.argv[i + 1]) : null;
})();

function findPackDir(nearPath: string): string | null {
  const candidates = [
    nearPath,
    path.dirname(nearPath),
    path.join(path.dirname(nearPath), "basegol_paulista_import_2026"),
    path.join(process.env.HOME ?? "", "Downloads", "basegol_paulista_import_2026"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "group_teams.csv"))) return dir;
    if (fs.existsSync(path.join(dir, "basegol_paulista_import_2026.json"))) return dir;
  }
  return null;
}

async function loadRoster(source: string): Promise<PaulistaGroupTeam[]> {
  const resolved = path.resolve(source);
  const packDir = findPackDir(resolved);
  if (packDir) {
    console.log(`Lista oficial: ${packDir}/group_teams.csv`);
    return loadPaulistaPack(packDir).groupTeams;
  }

  if (resolved.toLowerCase().endsWith(".pdf")) {
    console.log(`Lista via PDF: ${resolved}`);
    const buf = fs.readFileSync(resolved);
    const text = await extractTextFromPdf(buf);
    const sub11 = parseParticipantsPdfText(text, "Sub-11");
    const sub12 = sub11.map((r) => ({ ...r, competition_category: "Sub-12" as const }));
    return [...sub11, ...sub12];
  }

  throw new Error(`Fonte inválida: ${source} (PDF ou pasta com group_teams.csv)`);
}

async function resolveClubByOfficialName(
  officialName: string
): Promise<{ id: string; name: string } | null> {
  let club = await findExistingClub(officialName);
  if (club) return club;
  const parts = officialName.trim().split(/\s+/);
  for (let drop = 1; drop <= 4 && parts.length - drop >= 3; drop++) {
    club = await findExistingClub(parts.slice(0, -drop).join(" "));
    if (club) return club;
  }
  return null;
}

async function resolveExpectedClubIds(
  expectedRows: PaulistaGroupTeam[]
): Promise<Set<string>> {
  const ids = new Set<string>();
  for (const row of expectedRows) {
    const club = await resolveClubByOfficialName(row.official_name);
    if (club) ids.add(club.id);
  }
  return ids;
}

async function main() {
  const source = process.argv[2];
  if (!source) {
    console.error(
      "Uso: npx tsx scripts/sync-group-teams-from-roster.ts <pdf_ou_pasta> [--dry-run] [--category Sub-11|Sub-12]"
    );
    process.exit(1);
  }

  const roster = await loadRoster(source);
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
  });

  let added = 0;
  let removed = 0;
  let moved = 0;
  let missingClub = 0;

  const catNames = categoryFilter
    ? [categoryFilter]
    : [...new Set(roster.map((r) => normalizeAthleteCategory(r.competition_category)))];

  for (const catName of catNames) {
    const category = categories.find((c) => normalizeAthleteCategory(c.name) === catName);
    if (!category) {
      console.warn(`Categoria não encontrada no banco: ${catName}`);
      continue;
    }

    console.log(`\n=== ${catName} (${category.id}) ===`);

    const groups = await prisma.group.findMany({
      where: { categoryId: category.id },
      orderBy: { name: "asc" },
    });

    for (const group of groups) {
      const numMatch = group.name.match(/(\d{1,2})/);
      const groupNum = numMatch ? Number(numMatch[1]) : null;
      if (groupNum == null || groupNum < 1 || groupNum > 10) {
        console.warn(`  Ignorando grupo sem número: ${group.name}`);
        continue;
      }

      const expectedRows = roster.filter(
        (r) =>
          normalizeAthleteCategory(r.competition_category) === catName && r.group === groupNum
      );
      const expectedClubIds = await resolveExpectedClubIds(expectedRows);

      const teams = await prisma.team.findMany({
        where: { groupId: group.id },
        include: { club: { select: { id: true, name: true } } },
      });

      for (const team of teams) {
        if (expectedClubIds.has(team.clubId)) continue;
        console.log(
          `  ${dryRun ? "[dry-run] " : ""}Remover ${team.club.name} de ${group.name} (fora da lista oficial)`
        );
        if (!dryRun) {
          await removeTeamFromGroup(group.id, team.id, { force: true });
        }
        removed += 1;
      }

      for (const row of expectedRows) {
        const club = await resolveClubByOfficialName(row.official_name);
        if (!club) {
          console.warn(`  Clube não cadastrado: ${row.official_name}`);
          missingClub += 1;
          continue;
        }

        const teamsInCat = await prisma.team.findMany({
          where: { clubId: club.id, group: { categoryId: category.id } },
          include: { group: { select: { id: true, name: true } } },
        });

        const canonicalName = formatPaulistaGroupName(groupNum);
        const alreadyHere = teamsInCat.find((t) => t.groupId === group.id);

        for (const t of teamsInCat) {
          if (t.groupId === group.id) continue;
          console.log(
            `  ${dryRun ? "[dry-run] " : ""}Mover ${club.name}: ${t.group.name} → ${canonicalName}`
          );
          if (!dryRun) {
            await removeTeamFromGroup(t.group.id, t.id, { force: true });
          }
          moved += 1;
        }

        if (!alreadyHere) {
          console.log(
            `  ${dryRun ? "[dry-run] " : ""}Inscrever ${club.name} em ${canonicalName}`
          );
          if (!dryRun) {
            await ensureTeamInGroup(group.id, club.id);
          }
          added += 1;
        }
      }
    }

    if (!dryRun) {
      await recalculateStandingsForCategory(category.id);
      console.log(`  Classificação recalculada.`);
    }
  }

  console.log(
    `\n---\nInscrições${dryRun ? " (simulado)" : ""}: +${added}  movidas/removidas duplicata: ${moved}  removidas: ${removed}  clubes não encontrados: ${missingClub}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
