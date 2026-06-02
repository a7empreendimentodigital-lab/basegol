import type { Prisma } from "@prisma/client";
import { findExistingClub } from "@/lib/club-lookup";
import { applyCategoryMatchTime } from "@/lib/category-match-times";
import { prisma } from "@/lib/prisma";
import { normalizeEntityName } from "@/lib/normalize-name";
import {
  parseFpfRoundResultsPdfText,
  type ParsedFpfRoundMatch,
} from "@/services/match-results-import/fpf-round-results-pdf-parser";
import { extractTextFromPdf } from "@/services/schedule-import/pdf-text";
import {
  recalculateStandingsForCategory,
  recalculateStandingsForGroup,
} from "@/services/standings.service";

export type RoundResultsPdfPreviewRow = {
  matchNumber: number;
  roundNumber: number;
  homeClub: string;
  awayClub: string;
  scheduledAt: string;
  homeScore: number;
  awayScore: number;
  venueName: string;
  city: string;
  action: "update" | "create" | "error";
  message?: string;
};

export type RoundResultsPdfImportSummary = {
  total: number;
  updated: number;
  created: number;
  errors: number;
  roundNumbers: number[];
  standingsRecalculated: number;
};

export type RoundResultsPdfImportResult = {
  preview: RoundResultsPdfPreviewRow[];
  summary: RoundResultsPdfImportSummary;
  warnings: string[];
};

export type RoundResultsPdfImportInput = {
  championshipId: string;
  buffer: Buffer;
  fileName?: string;
  dryRun?: boolean;
  recalculateStandings?: boolean;
};

type TeamEnrollment = {
  groupId: string;
  categoryId: string;
  homeTeamId: string;
  awayTeamId: string;
};

async function resolveEnrollment(
  championshipId: string,
  homeClubId: string,
  awayClubId: string
): Promise<TeamEnrollment | null> {
  const teams = await prisma.team.findMany({
    where: {
      clubId: { in: [homeClubId, awayClubId] },
      group: { category: { championshipId } },
    },
    select: { id: true, clubId: true, groupId: true, group: { select: { categoryId: true } } },
  });

  const homeTeams = teams.filter((t) => t.clubId === homeClubId);
  const awayTeams = teams.filter((t) => t.clubId === awayClubId);

  for (const h of homeTeams) {
    const a = awayTeams.find((t) => t.groupId === h.groupId);
    if (a) {
      return {
        groupId: h.groupId,
        categoryId: h.group.categoryId,
        homeTeamId: h.id,
        awayTeamId: a.id,
      };
    }
  }
  return null;
}

async function findOrCreateVenue(venueName: string, city: string) {
  const name = venueName.trim() || city.trim() || "A definir";
  const normalizedName = normalizeEntityName(name);
  const existing = await prisma.venue.findUnique({ where: { normalizedName } });
  if (existing) return existing.id;
  const created = await prisma.venue.create({
    data: { name, normalizedName, city: city.trim() || null },
  });
  return created.id;
}

async function ensureCompetitionRound(
  championshipId: string,
  roundNumber: number
) {
  const phaseSlug = "fase-01";
  const turnSlug = "primeiro-turno";
  let phase = await prisma.competitionPhase.findFirst({
    where: { championshipId, slug: phaseSlug },
  });
  if (!phase) {
    phase = await prisma.competitionPhase.create({
      data: { championshipId, name: "FASE 01", slug: phaseSlug },
    });
  }
  let turn = await prisma.competitionTurn.findFirst({
    where: { phaseId: phase.id, slug: turnSlug },
  });
  if (!turn) {
    turn = await prisma.competitionTurn.create({
      data: { phaseId: phase.id, name: "PRIMEIRO TURNO", slug: turnSlug },
    });
  }
  const label = `Rodada ${String(roundNumber).padStart(2, "0")}`;
  let round = await prisma.competitionRound.findUnique({
    where: {
      championshipId_phaseId_turnId_number: {
        championshipId,
        phaseId: phase.id,
        turnId: turn.id,
        number: roundNumber,
      },
    },
  });
  if (!round) {
    round = await prisma.competitionRound.create({
      data: {
        championshipId,
        phaseId: phase.id,
        turnId: turn.id,
        number: roundNumber,
        label,
      },
    });
  }
  return round;
}

async function findExistingMatch(
  championshipId: string,
  row: ParsedFpfRoundMatch,
  homeClubId: string,
  awayClubId: string
) {
  const byNumber = await prisma.match.findFirst({
    where: { championshipId, matchNumber: row.matchNumber },
  });
  if (byNumber) return byNumber;

  return prisma.match.findFirst({
    where: {
      championshipId,
      round: row.roundNumber,
      homeClubId,
      awayClubId,
    },
    orderBy: { scheduledAt: "asc" },
  });
}

async function processRow(
  championshipId: string,
  row: ParsedFpfRoundMatch,
  dryRun: boolean
): Promise<RoundResultsPdfPreviewRow> {
  const home = await findExistingClub(row.homeRaw);
  const away = await findExistingClub(row.awayRaw);

  const base: RoundResultsPdfPreviewRow = {
    matchNumber: row.matchNumber,
    roundNumber: row.roundNumber,
    homeClub: row.homeRaw,
    awayClub: row.awayRaw,
    scheduledAt: row.scheduledAt.toISOString(),
    homeScore: row.homeScore,
    awayScore: row.awayScore,
    venueName: row.venueName,
    city: row.city,
    action: "error",
  };

  if (!home || !away) {
    return {
      ...base,
      message: !home
        ? `Mandante não cadastrado: ${row.homeRaw}`
        : `Visitante não cadastrado: ${row.awayRaw}`,
    };
  }

  base.homeClub = home.name;
  base.awayClub = away.name;

  const enrollment = await resolveEnrollment(championshipId, home.id, away.id);
  if (!enrollment) {
    return {
      ...base,
      message: "Clubes não estão no mesmo grupo (sincronize grupos FPF antes)",
    };
  }

  const category = await prisma.category.findUnique({
    where: { id: enrollment.categoryId },
    select: { name: true },
  });
  const scheduledAt = category
    ? applyCategoryMatchTime(row.scheduledAt, category.name)
    : row.scheduledAt;

  const existing = await findExistingMatch(championshipId, row, home.id, away.id);

  if (existing) {
    if (!dryRun) {
      const venueId = row.venueName
        ? await findOrCreateVenue(row.venueName, row.city)
        : existing.venueId;
      const competitionRound = await ensureCompetitionRound(
        championshipId,
        row.roundNumber
      );
      await prisma.match.update({
        where: { id: existing.id },
        data: {
          status: "FINISHED",
          homeScore: row.homeScore,
          awayScore: row.awayScore,
          scheduledAt,
          round: row.roundNumber,
          matchNumber: row.matchNumber,
          groupId: enrollment.groupId,
          homeTeamId: enrollment.homeTeamId,
          awayTeamId: enrollment.awayTeamId,
          homeClubId: home.id,
          awayClubId: away.id,
          venue: row.venueName || existing.venue,
          venueId,
          competitionRoundId: competitionRound.id,
          phaseId: competitionRound.phaseId,
          turnId: competitionRound.turnId,
        },
      });
    }
    return { ...base, scheduledAt: scheduledAt.toISOString(), action: "update" };
  }

  if (!dryRun) {
    const venueId = row.venueName
      ? await findOrCreateVenue(row.venueName, row.city)
      : null;
    const competitionRound = await ensureCompetitionRound(championshipId, row.roundNumber);
    await prisma.match.create({
      data: {
        championshipId,
        groupId: enrollment.groupId,
        homeTeamId: enrollment.homeTeamId,
        awayTeamId: enrollment.awayTeamId,
        homeClubId: home.id,
        awayClubId: away.id,
        phaseId: competitionRound.phaseId,
        turnId: competitionRound.turnId,
        competitionRoundId: competitionRound.id,
        matchNumber: row.matchNumber,
        round: row.roundNumber,
        scheduledAt,
        venue: row.venueName || null,
        venueId,
        status: "FINISHED",
        homeScore: row.homeScore,
        awayScore: row.awayScore,
      },
    });
  }

  return { ...base, scheduledAt: scheduledAt.toISOString(), action: "create" };
}

export async function previewRoundResultsPdfImport(
  input: RoundResultsPdfImportInput
): Promise<RoundResultsPdfImportResult> {
  return runRoundResultsPdfImport({ ...input, dryRun: true });
}

export async function runRoundResultsPdfImport(
  input: RoundResultsPdfImportInput
): Promise<RoundResultsPdfImportResult> {
  const championship = await prisma.championship.findUnique({
    where: { id: input.championshipId },
  });
  if (!championship) throw new Error("Campeonato não encontrado.");

  const text = await extractTextFromPdf(input.buffer);
  const parsed = parseFpfRoundResultsPdfText(text);

  if (parsed.matches.length === 0) {
    throw new Error(
      "Nenhum jogo com placar encontrado no PDF. Use o arquivo da rodada em futebolpaulista.com.br (Tabela)."
    );
  }

  const dryRun = input.dryRun === true;
  const recalc = input.recalculateStandings !== false;
  const preview: RoundResultsPdfPreviewRow[] = [];
  const summary: RoundResultsPdfImportSummary = {
    total: parsed.matches.length,
    updated: 0,
    created: 0,
    errors: 0,
    roundNumbers: parsed.roundNumbers,
    standingsRecalculated: 0,
  };

  const affectedGroupIds = new Set<string>();
  const affectedCategoryIds = new Set<string>();

  for (const row of parsed.matches) {
    const result = await processRow(input.championshipId, row, dryRun);
    preview.push(result);
    if (result.action === "update") summary.updated += 1;
    else if (result.action === "create") summary.created += 1;
    else summary.errors += 1;

    if (!dryRun && result.action !== "error") {
      const home = await findExistingClub(row.homeRaw);
      const away = await findExistingClub(row.awayRaw);
      if (home && away) {
        const enrollment = await resolveEnrollment(
          input.championshipId,
          home.id,
          away.id
        );
        if (enrollment) {
          affectedGroupIds.add(enrollment.groupId);
          affectedCategoryIds.add(enrollment.categoryId);
        }
      }
    }
  }

  if (!dryRun && recalc) {
    for (const groupId of affectedGroupIds) {
      await recalculateStandingsForGroup(groupId);
      summary.standingsRecalculated += 1;
    }
    for (const categoryId of affectedCategoryIds) {
      await recalculateStandingsForCategory(categoryId);
    }
  }

  if (!dryRun && input.fileName) {
    await prisma.scheduleImport.create({
      data: {
        championshipId: input.championshipId,
        fileName: input.fileName,
        status: summary.errors > 0 && summary.updated + summary.created === 0 ? "FAILED" : "COMPLETED",
        summary: summary as unknown as Prisma.InputJsonValue,
        finishedAt: new Date(),
        startedAt: new Date(),
      },
    });
  }

  return { preview: preview.slice(0, 500), summary, warnings: parsed.warnings };
}
