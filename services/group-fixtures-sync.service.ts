import { existsSync } from "node:fs";
import path from "node:path";
import { normalizeAthleteCategory } from "@/lib/athlete-category";
import { resolveFpfPackDir } from "@/lib/fpf-pack-paths";
import { resolveDefaultPaulistaChampionshipId } from "@/lib/resolve-paulista-championship";
import { prisma } from "@/lib/prisma";
import { runPaulistaPackImport } from "@/services/paulista-pack-import/paulista-pack-import.service";
import { loadPaulistaPack } from "@/services/paulista-pack-import/paulista-pack-loader";
import { previewPaulistaPack } from "@/services/paulista-pack-import/paulista-pack-preview";
import { syncGroupTeamsFromDefaultCsv } from "@/services/group-roster-sync.service";
import { backfillMatchRoundsFromFpfPack } from "@/services/match-round-backfill.service";
import { recalculateStandingsForCategory } from "@/services/standings.service";
import type { ScheduleImportSummary } from "@/services/schedule-import/schedule-import.service";

export type GroupFixturesSyncResult = {
  championshipId: string;
  championshipName: string;
  packDir: string;
  roster?: { added: number; removed: number; moved: number };
  import: {
    matchesCreated: number;
    matchesIgnored: number;
    matchesSkippedDuplicate: number;
    errors: number;
    byCategory: ScheduleImportSummary["byCategory"];
  };
  matchesReconciled: number;
  roundsBackfill?: {
    updated: number;
    alreadyCorrect: number;
    missingMatch: number;
  };
};

export { resolveDefaultPaulistaChampionshipId } from "@/lib/resolve-paulista-championship";

/** Ajusta groupId e times dos jogos conforme inscrições atuais nos grupos. */
export async function reconcileMatchesWithGroups(
  categoryId: string
): Promise<number> {
  const teams = await prisma.team.findMany({
    where: { group: { categoryId } },
    select: { id: true, clubId: true, groupId: true },
  });

  const clubToTeam = new Map<string, { teamId: string; groupId: string }>();
  for (const t of teams) {
    const prev = clubToTeam.get(t.clubId);
    if (prev && prev.groupId !== t.groupId) continue;
    clubToTeam.set(t.clubId, { teamId: t.id, groupId: t.groupId });
  }

  const matches = await prisma.match.findMany({
    where: { group: { categoryId } },
    select: {
      id: true,
      groupId: true,
      homeTeamId: true,
      awayTeamId: true,
      homeClubId: true,
      awayClubId: true,
      homeTeam: { select: { clubId: true } },
      awayTeam: { select: { clubId: true } },
    },
  });

  let updated = 0;
  for (const m of matches) {
    const homeClubId = m.homeClubId ?? m.homeTeam.clubId;
    const awayClubId = m.awayClubId ?? m.awayTeam.clubId;
    const home = clubToTeam.get(homeClubId);
    const away = clubToTeam.get(awayClubId);
    if (!home || !away || home.groupId !== away.groupId) continue;

    const groupId = home.groupId;
    if (
      m.groupId === groupId &&
      m.homeTeamId === home.teamId &&
      m.awayTeamId === away.teamId
    ) {
      continue;
    }

    await prisma.match.update({
      where: { id: m.id },
      data: {
        groupId,
        homeTeamId: home.teamId,
        awayTeamId: away.teamId,
        homeClubId,
        awayClubId,
      },
    });
    updated += 1;
  }

  return updated;
}

export async function syncFixturesFromFpfPack(input: {
  packDir?: string;
  championshipId?: string;
  createdById?: string;
  categoryFilter?: string | null;
  syncRosterFirst?: boolean;
  dryRun?: boolean;
}): Promise<GroupFixturesSyncResult> {
  const packDir = input.packDir ?? resolveFpfPackDir();
  if (!existsSync(path.join(packDir, "fixtures.csv"))) {
    throw new Error(`fixtures.csv não encontrado em ${packDir}`);
  }

  const championship = input.championshipId
    ? await prisma.championship.findUniqueOrThrow({
        where: { id: input.championshipId },
        select: { id: true, name: true },
      })
    : await resolveDefaultPaulistaChampionshipId();

  const pack = loadPaulistaPack(packDir);
  const preview = previewPaulistaPack(pack);

  if (input.dryRun) {
    return {
      championshipId: championship.id,
      championshipName: championship.name,
      packDir,
      import: {
        matchesCreated: preview.totals.matches,
        matchesIgnored: 0,
        matchesSkippedDuplicate: 0,
        errors: 0,
        byCategory: preview.categories.map((c) => ({
          categoryHint: c.categoryHint,
          categoryId: "",
          matchesImported: c.matches,
          matchesSkippedDuplicate: 0,
          errors: 0,
        })),
      },
      matchesReconciled: 0,
    };
  }

  let roster: GroupFixturesSyncResult["roster"];
  if (input.syncRosterFirst === true) {
    const rosterResult = await syncGroupTeamsFromDefaultCsv({
      categoryFilter: input.categoryFilter ?? null,
    });
    roster = {
      added: rosterResult.added,
      removed: rosterResult.removed,
      moved: rosterResult.moved,
    };
  }

  const importResult = await runPaulistaPackImport({
    sourcePath: packDir,
    championshipId: championship.id,
    createdById: input.createdById,
    participantsOnly: false,
    categoryHint: input.categoryFilter ?? undefined,
    fileName: "fpf-fixtures-sync",
    autoCreateCategory: false,
  });

  const summary = importResult.summary;
  const categoryIds =
    importResult.categories?.map((c) => c.categoryId).filter(Boolean) ?? [];

  const categories =
    categoryIds.length > 0
      ? await prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : await prisma.category.findMany({
          where: { championshipId: championship.id, status: "ACTIVE" },
          select: { id: true, name: true },
        });

  const filtered = input.categoryFilter
    ? categories.filter(
        (c) =>
          normalizeAthleteCategory(c.name) ===
          normalizeAthleteCategory(input.categoryFilter!)
      )
    : categories;

  let matchesReconciled = 0;
  for (const cat of filtered) {
    matchesReconciled += await reconcileMatchesWithGroups(cat.id);
    await recalculateStandingsForCategory(cat.id);
  }

  const roundsBackfill = await backfillMatchRoundsFromFpfPack({
    championshipId: championship.id,
    packDir,
    categoryFilter: input.categoryFilter ?? null,
  });

  return {
    championshipId: championship.id,
    championshipName: championship.name,
    packDir,
    roster,
    import: {
      matchesCreated: summary.matchesCreated,
      matchesIgnored: summary.matchesIgnored,
      matchesSkippedDuplicate: summary.matchesSkippedDuplicate,
      errors: summary.errors,
      byCategory: summary.byCategory,
    },
    matchesReconciled,
    roundsBackfill: {
      updated: roundsBackfill.updated,
      alreadyCorrect: roundsBackfill.alreadyCorrect,
      missingMatch: roundsBackfill.missingMatch,
    },
  };
}
