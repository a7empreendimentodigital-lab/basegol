import path from "node:path";
import { findExistingClub } from "@/lib/club-lookup";
import { normalizeAthleteCategory } from "@/lib/athlete-category";
import { ensureTeamInGroup } from "@/lib/team-enrollment";
import { prisma } from "@/lib/prisma";
import { formatPaulistaGroupName } from "@/services/paulista-pack-import/paulista-pack-convert";
import {
  loadGroupTeamsCsvFile,
  loadPaulistaPack,
} from "@/services/paulista-pack-import/paulista-pack-loader";
import type { PaulistaGroupTeam } from "@/services/paulista-pack-import/paulista-pack.types";
import { removeTeamFromGroup } from "@/services/group-team-admin.service";
import { recalculateStandingsForCategory } from "@/services/standings.service";

export const DEFAULT_GROUP_TEAMS_CSV = path.join(
  process.cwd(),
  "data/fpf-2026/group_teams.csv"
);

export type GroupRosterSyncResult = {
  added: number;
  removed: number;
  moved: number;
  missingClub: number;
  missingClubNames: string[];
  byCategory: Array<{
    categoryName: string;
    categoryId: string;
    added: number;
    removed: number;
    moved: number;
  }>;
};

export async function resolveClubByOfficialName(
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

export async function syncGroupTeamsFromRoster(
  roster: PaulistaGroupTeam[],
  options?: {
    categoryFilter?: string | null;
    dryRun?: boolean;
    recalculateStandings?: boolean;
  }
): Promise<GroupRosterSyncResult> {
  const dryRun = options?.dryRun ?? false;
  const recalculate = options?.recalculateStandings ?? !dryRun;
  const categoryFilter = options?.categoryFilter
    ? normalizeAthleteCategory(options.categoryFilter)
    : null;

  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
  });

  const result: GroupRosterSyncResult = {
    added: 0,
    removed: 0,
    moved: 0,
    missingClub: 0,
    missingClubNames: [],
    byCategory: [],
  };

  const catNames = categoryFilter
    ? [categoryFilter]
    : [...new Set(roster.map((r) => normalizeAthleteCategory(r.competition_category)))];

  for (const catName of catNames) {
    const category = categories.find((c) => normalizeAthleteCategory(c.name) === catName);
    if (!category) continue;

    const catStats = {
      categoryName: catName,
      categoryId: category.id,
      added: 0,
      removed: 0,
      moved: 0,
    };

    const groups = await prisma.group.findMany({
      where: { categoryId: category.id },
      orderBy: { name: "asc" },
    });

    for (const group of groups) {
      const numMatch = group.name.match(/(\d{1,2})/);
      const groupNum = numMatch ? Number(numMatch[1]) : null;
      if (groupNum == null || groupNum < 1 || groupNum > 10) continue;

      const expectedRows = roster.filter(
        (r) =>
          normalizeAthleteCategory(r.competition_category) === catName &&
          r.group === groupNum
      );
      const expectedClubIds = await resolveExpectedClubIds(expectedRows);

      const teams = await prisma.team.findMany({
        where: { groupId: group.id },
        include: { club: { select: { id: true, name: true } } },
      });

      for (const team of teams) {
        if (expectedClubIds.has(team.clubId)) continue;
        if (!dryRun) {
          await removeTeamFromGroup(group.id, team.id, { force: true });
        }
        result.removed += 1;
        catStats.removed += 1;
      }

      for (const row of expectedRows) {
        const club = await resolveClubByOfficialName(row.official_name);
        if (!club) {
          result.missingClub += 1;
          if (result.missingClubNames.length < 30) {
            result.missingClubNames.push(row.official_name);
          }
          continue;
        }

        const teamsInCat = await prisma.team.findMany({
          where: { clubId: club.id, group: { categoryId: category.id } },
          include: { group: { select: { id: true, name: true } } },
        });

        const alreadyHere = teamsInCat.some((t) => t.groupId === group.id);

        for (const t of teamsInCat) {
          if (t.groupId === group.id) continue;
          if (!dryRun) {
            await removeTeamFromGroup(t.group.id, t.id, { force: true });
          }
          result.moved += 1;
          catStats.moved += 1;
        }

        if (!alreadyHere) {
          if (!dryRun) {
            await ensureTeamInGroup(group.id, club.id);
          }
          result.added += 1;
          catStats.added += 1;
        }
      }
    }

    if (!dryRun && recalculate) {
      await recalculateStandingsForCategory(category.id);
    }

    result.byCategory.push(catStats);
  }

  return result;
}

export async function syncGroupTeamsFromPackDir(
  packDir: string,
  options?: Parameters<typeof syncGroupTeamsFromRoster>[1]
): Promise<GroupRosterSyncResult> {
  const pack = loadPaulistaPack(packDir);
  return syncGroupTeamsFromRoster(pack.groupTeams, options);
}

export async function syncGroupTeamsFromDefaultCsv(
  options?: Parameters<typeof syncGroupTeamsFromRoster>[1]
): Promise<GroupRosterSyncResult> {
  const roster = loadGroupTeamsCsvFile(DEFAULT_GROUP_TEAMS_CSV);
  return syncGroupTeamsFromRoster(roster, options);
}
