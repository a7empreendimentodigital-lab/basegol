import path from "node:path";
import { findExistingClub } from "@/lib/club-lookup";
import { normalizeAthleteCategory } from "@/lib/athlete-category";
import { isLikelySameClub, normalizeClubName } from "@/lib/normalize-name";
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
  const sourceName = officialName.trim();
  let club = await findExistingClub(sourceName);
  if (club) {
    return pickPreferredClubVariant(sourceName, club);
  }
  const parts = officialName.trim().split(/\s+/);
  for (let drop = 1; drop <= 4 && parts.length - drop >= 3; drop++) {
    club = await findExistingClub(parts.slice(0, -drop).join(" "));
    if (club) {
      return pickPreferredClubVariant(sourceName, club);
    }
  }
  return null;
}

function clubVariantScore(club: {
  name: string;
  _count: {
    teams: number;
    athletes: number;
    registrations: number;
    clubUsers: number;
    staffMembers: number;
  };
}): number {
  const normalized = normalizeClubName(club.name);
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const suffixPenalty = tokens.length >= 4 ? 1 : 0;
  return (
    club._count.athletes * 100 +
    club._count.registrations * 40 +
    club._count.clubUsers * 20 +
    club._count.teams * 12 +
    club._count.staffMembers * 5 -
    suffixPenalty
  );
}

async function pickPreferredClubVariant(
  rosterName: string,
  preferred: { id: string; name: string }
): Promise<{ id: string; name: string }> {
  const rosterNorm = normalizeClubName(rosterName);
  const preferredNorm = normalizeClubName(preferred.name);
  const areCloseVariants = (candidateName: string) => {
    const candidateNorm = normalizeClubName(candidateName);
    const prefixMatch =
      candidateNorm.startsWith(rosterNorm) ||
      rosterNorm.startsWith(candidateNorm) ||
      candidateNorm.startsWith(preferredNorm) ||
      preferredNorm.startsWith(candidateNorm);
    if (prefixMatch) return true;
    return (
      isLikelySameClub(rosterName, candidateName) &&
      isLikelySameClub(preferred.name, candidateName)
    );
  };

  const candidates = await prisma.club.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          teams: true,
          athletes: true,
          registrations: true,
          clubUsers: true,
          staffMembers: true,
        },
      },
    },
  });

  const related = candidates.filter(
    (c) =>
      c.id === preferred.id ||
      areCloseVariants(c.name)
  );

  if (related.length <= 1) return preferred;

  const sorted = related.sort((a, b) => clubVariantScore(b) - clubVariantScore(a));
  const best = sorted[0];
  const current = related.find((c) => c.id === preferred.id) ?? best;

  if (best.id === current.id) return preferred;

  const currentScore = clubVariantScore(current);
  const bestScore = clubVariantScore(best);
  const currentHasCoreData =
    current._count.athletes > 0 || current._count.clubUsers > 0 || current._count.registrations > 0;
  const bestHasCoreData =
    best._count.athletes > 0 || best._count.clubUsers > 0 || best._count.registrations > 0;

  // Só troca automaticamente quando o clube atual é claramente um duplicado "vazio".
  if (!currentHasCoreData && bestHasCoreData && bestScore >= currentScore + 20) {
    return { id: best.id, name: best.name };
  }

  return preferred;
}

async function resolveExpectedClubIds(
  expectedRows: PaulistaGroupTeam[]
): Promise<Set<string>> {
  const ids = new Set<string>();
  for (const row of expectedRows) {
    const club =
      (await resolveClubByOfficialName(row.official_name)) ||
      (row.alias ? await resolveClubByOfficialName(row.alias) : null);
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
        const club =
          (await resolveClubByOfficialName(row.official_name)) ||
          (row.alias ? await resolveClubByOfficialName(row.alias) : null);
        if (!club) {
          result.missingClub += 1;
          if (result.missingClubNames.length < 30) {
            result.missingClubNames.push(
              row.alias ? `${row.official_name} (${row.alias})` : row.official_name
            );
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
