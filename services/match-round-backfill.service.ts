import { normalizeAthleteCategory } from "@/lib/athlete-category";
import { applyCategoryMatchTime } from "@/lib/category-match-times";
import { resolveFpfPackDir } from "@/lib/fpf-pack-paths";
import { prisma } from "@/lib/prisma";
import { ensurePaulistaCompetitionRound } from "@/services/competition-round.service";
import { resolveClubByOfficialName } from "@/services/group-roster-sync.service";
import { resolveDefaultPaulistaChampionshipId } from "@/lib/resolve-paulista-championship";
import { fixtureToMatch } from "@/services/paulista-pack-import/paulista-pack-convert";
import { loadPaulistaPack } from "@/services/paulista-pack-import/paulista-pack-loader";
import type { PaulistaFixture } from "@/services/paulista-pack-import/paulista-pack.types";

export type MatchRoundBackfillResult = {
  championshipId: string;
  totalFixtures: number;
  updated: number;
  alreadyCorrect: number;
  missingMatch: number;
  missingClub: number;
  errors: number;
  byRound: Record<number, number>;
};

async function resolveCategoryId(
  championshipId: string,
  categoryHint: string
): Promise<string | null> {
  const norm = normalizeAthleteCategory(categoryHint);
  const cats = await prisma.category.findMany({
    where: { championshipId, status: "ACTIVE" },
    select: { id: true, name: true },
  });
  const hit = cats.find((c) => normalizeAthleteCategory(c.name) === norm);
  return hit?.id ?? null;
}

export async function backfillMatchRoundsFromFpfPack(input?: {
  championshipId?: string;
  packDir?: string;
  categoryFilter?: string | null;
  dryRun?: boolean;
}): Promise<MatchRoundBackfillResult> {
  const packDir = input?.packDir ?? resolveFpfPackDir();
  const championship = input?.championshipId
    ? await prisma.championship.findUniqueOrThrow({
        where: { id: input.championshipId },
        select: { id: true },
      })
    : await resolveDefaultPaulistaChampionshipId();

  const pack = loadPaulistaPack(packDir);
  const dryRun = input?.dryRun === true;
  const categoryFilter = input?.categoryFilter
    ? normalizeAthleteCategory(input.categoryFilter)
    : null;

  let fixtures: PaulistaFixture[] = pack.fixtures;
  if (categoryFilter) {
    fixtures = fixtures.filter(
      (f) => normalizeAthleteCategory(f.category) === categoryFilter
    );
  }

  const result: MatchRoundBackfillResult = {
    championshipId: championship.id,
    totalFixtures: fixtures.length,
    updated: 0,
    alreadyCorrect: 0,
    missingMatch: 0,
    missingClub: 0,
    errors: 0,
    byRound: {},
  };

  const categoryNameCache = new Map<string, string>();

  for (const f of fixtures) {
    const round = f.round;
    result.byRound[round] = (result.byRound[round] ?? 0) + 1;

    try {
      const home =
        (await resolveClubByOfficialName(f.home_official)) ||
        (await resolveClubByOfficialName(f.home_alias));
      const away =
        (await resolveClubByOfficialName(f.away_official)) ||
        (await resolveClubByOfficialName(f.away_alias));

      if (!home || !away) {
        result.missingClub += 1;
        continue;
      }

      let categoryId = categoryNameCache.get(f.category);
      if (!categoryId) {
        const id = await resolveCategoryId(championship.id, f.category);
        if (!id) {
          result.errors += 1;
          continue;
        }
        categoryId = id;
        categoryNameCache.set(f.category, id);
      }

      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { name: true },
      });

      const warnings: string[] = [];
      const parsed = fixtureToMatch(f, pack.season, f.category, warnings);
      const scheduledAt = parsed
        ? applyCategoryMatchTime(parsed.scheduledAt, category?.name ?? f.category)
        : null;

      let match = await prisma.match.findFirst({
        where: {
          championshipId: championship.id,
          matchNumber: f.match_number,
        },
        select: {
          id: true,
          round: true,
          competitionRoundId: true,
          homeClubId: true,
          awayClubId: true,
        },
      });

      if (!match) {
        match = await prisma.match.findFirst({
          where: {
            championshipId: championship.id,
            round,
            OR: [
              { homeClubId: home.id, awayClubId: away.id },
              { homeClubId: away.id, awayClubId: home.id },
            ],
            group: { categoryId },
          },
          select: {
            id: true,
            round: true,
            competitionRoundId: true,
            homeClubId: true,
            awayClubId: true,
          },
          orderBy: { scheduledAt: "asc" },
        });
      }

      if (!match) {
        result.missingMatch += 1;
        continue;
      }

      const { phase, turn, round: competitionRound } = await ensurePaulistaCompetitionRound(
        championship.id,
        round
      );

      const needsUpdate =
        match.round !== round ||
        match.competitionRoundId !== competitionRound.id ||
        match.homeClubId !== home.id ||
        match.awayClubId !== away.id;

      if (!needsUpdate) {
        result.alreadyCorrect += 1;
        continue;
      }

      if (!dryRun) {
        await prisma.match.update({
          where: { id: match.id },
          data: {
            round,
            matchNumber: f.match_number,
            competitionRoundId: competitionRound.id,
            phaseId: phase.id,
            turnId: turn.id,
            homeClubId: home.id,
            awayClubId: away.id,
            ...(scheduledAt ? { scheduledAt } : {}),
            venue: f.venue || undefined,
          },
        });
      }
      result.updated += 1;
    } catch {
      result.errors += 1;
    }
  }

  return result;
}
