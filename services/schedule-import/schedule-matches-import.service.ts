import type { Prisma, ScheduleImportLogLevel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildMatchImportFingerprint } from "@/lib/match-import-fingerprint";
import { findExistingClub } from "@/lib/club-lookup";
import { normalizeClubName, normalizeEntityName } from "@/lib/normalize-name";
import { slugify } from "@/lib/utils";
import { extractTextFromPdf } from "@/services/schedule-import/pdf-text";
import {
  ClubNameResolver,
  groupForClubs,
  parseFpPaulistaSchedules,
  type ParsedFpSchedule,
  type ParsedParticipantClub,
  type ParsedScheduleMatch,
} from "@/services/schedule-import/fp-paulista-parser";
import { loadParticipantsFromCategory } from "@/services/schedule-import/category-participants";
import {
  categoryMatchesFilter,
  groupMatchesFilter,
  normalizeGroupFilterInput,
  type ScheduleImportFilters,
} from "@/services/schedule-import/import-filters";
import { findExistingImportedMatch } from "@/services/schedule-import/find-existing-match";
import type { ScheduleImportSummary } from "@/services/schedule-import/schedule-import.service";

export type { ScheduleImportFilters };

export type MatchPreviewStatus =
  | "create"
  | "update"
  | "skip_duplicate"
  | "skip_filtered"
  | "error";

export type MatchImportPreviewRow = {
  matchNumber: number;
  categoryHint: string;
  groupName: string;
  roundNumber: number;
  phaseName: string;
  turnName: string;
  homeName: string;
  awayName: string;
  scheduledAt: string;
  venueName: string;
  status: MatchPreviewStatus;
  message?: string;
};

export type MatchesImportPreview = {
  championshipId: string;
  championshipName: string;
  filters: ScheduleImportFilters;
  detectedCategories: string[];
  categories: Array<{
    categoryHint: string;
    categoryId: string;
    categoryName: string;
    matchCountInPdf: number;
    rows: MatchImportPreviewRow[];
  }>;
  totals: {
    toCreate: number;
    toUpdate: number;
    toSkip: number;
    errors: number;
  };
  warnings: string[];
};

export type RunMatchesImportInput = {
  buffer: Buffer;
  fileName: string;
  championshipId: string;
  categoryId?: string;
  createdById?: string;
  filters?: ScheduleImportFilters;
  /** Não cria clubes, grupos nem times — só jogos com cadastro existente. */
  matchesOnly?: boolean;
};

type ResolvedMatchContext = {
  parsed: ParsedScheduleMatch;
  categoryHint: string;
  categoryId: string;
  categorySlug: string;
  groupName: string;
  homeClubId: string;
  awayClubId: string;
  homeTeamId: string;
  awayTeamId: string;
  groupId: string;
  homeName: string;
  awayName: string;
};

function categoryHintsMatch(a: string, b: string): boolean {
  return slugify(a) === slugify(b);
}

function emptySummary(): ScheduleImportSummary {
  return {
    clubsCreated: 0,
    clubsReused: 0,
    venuesCreated: 0,
    venuesReused: 0,
    groupsCreated: 0,
    groupsReused: 0,
    phasesCreated: 0,
    phasesReused: 0,
    turnsCreated: 0,
    turnsReused: 0,
    roundsCreated: 0,
    roundsReused: 0,
    teamsCreated: 0,
    teamsReused: 0,
    matchesImported: 0,
    matchesCreated: 0,
    matchesUpdated: 0,
    matchesIgnored: 0,
    matchesSkippedDuplicate: 0,
    errors: 0,
    warnings: [],
  };
}

async function resolveCategory(
  championshipId: string,
  categoryId: string | undefined,
  parsed: ParsedFpSchedule
) {
  if (categoryId) {
    const cat = await prisma.category.findFirst({
      where: { id: categoryId, championshipId },
    });
    if (!cat) throw new Error("Categoria não encontrada neste campeonato.");
    return cat;
  }
  const slug = slugify(parsed.categoryHint);
  const cat = await prisma.category.findUnique({
    where: { championshipId_slug: { championshipId, slug } },
  });
  if (!cat) {
    throw new Error(
      `Categoria "${parsed.categoryHint}" não cadastrada. Cadastre Sub-11/Sub-12 antes de importar jogos.`
    );
  }
  return cat;
}

async function resolveExistingClubStrict(
  name: string,
  resolver: ClubNameResolver
): Promise<{ id: string; name: string }> {
  const existing = await findExistingClub(name, resolver);
  if (!existing) {
    throw new Error(`Clube não encontrado no cadastro: ${resolver.resolve(name)}`);
  }
  return existing;
}

async function resolveGroupAndTeams(
  categoryId: string,
  groupName: string,
  homeClubId: string,
  awayClubId: string
): Promise<{ groupId: string; homeTeamId: string; awayTeamId: string }> {
  const group = await prisma.group.findFirst({
    where: {
      categoryId,
      OR: [{ slug: slugify(groupName) }, { name: groupName }],
    },
  });
  if (!group) {
    throw new Error(`Grupo não encontrado: ${groupName}`);
  }

  const homeTeam = await prisma.team.findUnique({
    where: { clubId_groupId: { clubId: homeClubId, groupId: group.id } },
  });
  const awayTeam = await prisma.team.findUnique({
    where: { clubId_groupId: { clubId: awayClubId, groupId: group.id } },
  });

  if (!homeTeam) {
    throw new Error(`Mandante não está inscrito no ${group.name}`);
  }
  if (!awayTeam) {
    throw new Error(`Visitante não está inscrito no ${group.name}`);
  }

  return { groupId: group.id, homeTeamId: homeTeam.id, awayTeamId: awayTeam.id };
}

async function findOrCreateVenue(venueName: string) {
  const normalizedName = normalizeEntityName(venueName);
  const existing = await prisma.venue.findUnique({ where: { normalizedName } });
  if (existing) return { id: existing.id, created: false };
  const venue = await prisma.venue.create({
    data: { name: venueName.trim(), normalizedName },
  });
  return { id: venue.id, created: true };
}

async function findOrCreatePhase(championshipId: string, phaseName: string, phaseSlug: string) {
  const existing = await prisma.competitionPhase.findFirst({
    where: { championshipId, OR: [{ slug: phaseSlug }, { name: phaseName }] },
  });
  if (existing) return { phase: existing, created: false };
  const phase = await prisma.competitionPhase.create({
    data: { championshipId, name: phaseName, slug: phaseSlug },
  });
  return { phase, created: true };
}

async function findOrCreateTurn(phaseId: string, turnName: string, turnSlug: string) {
  const existing = await prisma.competitionTurn.findFirst({
    where: { phaseId, OR: [{ slug: turnSlug }, { name: turnName }] },
  });
  if (existing) return { turn: existing, created: false };
  const turn = await prisma.competitionTurn.create({
    data: { phaseId, name: turnName, slug: turnSlug },
  });
  return { turn, created: true };
}

async function findOrCreateRound(
  championshipId: string,
  phaseId: string,
  turnId: string,
  number: number,
  label: string
) {
  const existing = await prisma.competitionRound.findUnique({
    where: {
      championshipId_phaseId_turnId_number: {
        championshipId,
        phaseId,
        turnId,
        number,
      },
    },
  });
  if (existing) return { round: existing, created: false };
  const round = await prisma.competitionRound.create({
    data: { championshipId, phaseId, turnId, number, label },
  });
  return { round, created: true };
}

function filterParsedSchedule(
  parsed: ParsedFpSchedule,
  filters?: ScheduleImportFilters
): ParsedFpSchedule {
  const categoryFilter = filters?.categoryHint;
  let matches = parsed.matches;

  if (categoryFilter && !categoryMatchesFilter(parsed.categoryHint, categoryFilter)) {
    matches = [];
  }

  if (filters?.roundNumber != null) {
    matches = matches.filter((m) => m.roundNumber === filters.roundNumber);
  }

  return { ...parsed, matches };
}

async function buildResolverForCategory(
  categoryId: string,
  parsed: ParsedFpSchedule
): Promise<ClubNameResolver> {
  const fromDb = await loadParticipantsFromCategory(categoryId);
  const merged = [...fromDb];
  for (const p of parsed.participants) {
    if (!merged.some((m) => normalizeClubName(m.fullName) === normalizeClubName(p.fullName))) {
      merged.push(p);
    }
  }
  return new ClubNameResolver(merged);
}

async function resolveMatchContext(
  categoryId: string,
  categorySlug: string,
  categoryHint: string,
  m: ParsedScheduleMatch,
  resolver: ClubNameResolver,
  participants: ParsedParticipantClub[],
  filters?: ScheduleImportFilters
): Promise<
  | { kind: "ok"; ctx: ResolvedMatchContext }
  | { kind: "skip"; reason: string; status: MatchPreviewStatus }
> {
  const groupName = groupForClubs(resolver, participants, m.homeRaw, m.awayRaw);

  if (filters?.groupName && !groupMatchesFilter(groupName, filters.groupName)) {
    return {
      kind: "skip",
      reason: `Fora do grupo filtrado (${normalizeGroupFilterInput(filters.groupName)})`,
      status: "skip_filtered",
    };
  }

  if (filters?.roundNumber != null && m.roundNumber !== filters.roundNumber) {
    return {
      kind: "skip",
      reason: `Rodada ${m.roundNumber} fora do filtro`,
      status: "skip_filtered",
    };
  }

  try {
    const homeClub = await resolveExistingClubStrict(m.homeRaw, resolver);
    const awayClub = await resolveExistingClubStrict(m.awayRaw, resolver);
    const { groupId, homeTeamId, awayTeamId } = await resolveGroupAndTeams(
      categoryId,
      groupName,
      homeClub.id,
      awayClub.id
    );

    return {
      kind: "ok",
      ctx: {
        parsed: m,
        categoryHint,
        categoryId,
        categorySlug,
        groupName,
        homeClubId: homeClub.id,
        awayClubId: awayClub.id,
        homeTeamId,
        awayTeamId,
        groupId,
        homeName: homeClub.name,
        awayName: awayClub.name,
      },
    };
  } catch (e) {
    return {
      kind: "skip",
      reason: e instanceof Error ? e.message : String(e),
      status: "error",
    };
  }
}

async function classifyMatch(
  championshipId: string,
  ctx: ResolvedMatchContext
): Promise<{ status: MatchPreviewStatus; message?: string }> {
  const m = ctx.parsed;
  const existing = await findExistingImportedMatch({
    championshipId,
    categorySlug: ctx.categorySlug,
    categoryId: ctx.categoryId,
    phaseSlug: m.phaseSlug,
    turnSlug: m.turnSlug,
    roundNumber: m.roundNumber,
    scheduledAt: m.scheduledAt,
    homeClubId: ctx.homeClubId,
    awayClubId: ctx.awayClubId,
  });

  if (!existing) return { status: "create" };

  const needsUpdate =
    existing.scheduledAt.getTime() !== m.scheduledAt.getTime() ||
    (existing.venue ?? "") !== m.venueName ||
    existing.matchNumber !== m.matchNumber;

  if (needsUpdate) {
    return { status: "update", message: "Atualizar data, local ou número do jogo" };
  }
  return { status: "skip_duplicate", message: "Jogo já cadastrado" };
}

export async function previewScheduleMatchesImport(
  input: RunMatchesImportInput
): Promise<MatchesImportPreview> {
  const championship = await prisma.championship.findUnique({
    where: { id: input.championshipId },
  });
  if (!championship) throw new Error("Campeonato não encontrado.");

  const text = await extractTextFromPdf(input.buffer);
  const allSchedules = parseFpPaulistaSchedules(text);
  const detectedCategories = [...new Set(allSchedules.map((s) => s.categoryHint))];
  const filters = input.filters ?? {};

  let schedules = allSchedules.map((s) => filterParsedSchedule(s, filters));

  if (input.categoryId) {
    const selected = await prisma.category.findFirst({
      where: { id: input.categoryId, championshipId: input.championshipId },
    });
    if (!selected) throw new Error("Categoria não encontrada.");
    schedules = schedules.filter((s) => categoryHintsMatch(s.categoryHint, selected.name));
  } else if (filters.categoryHint) {
    schedules = schedules.filter((s) => categoryMatchesFilter(s.categoryHint, filters.categoryHint!));
  }

  if (schedules.length === 0) {
    throw new Error(
      `Nenhuma categoria compatível no PDF. Detectado: ${detectedCategories.join(", ") || "nenhuma"}.`
    );
  }

  const categories: MatchesImportPreview["categories"] = [];
  const totals = { toCreate: 0, toUpdate: 0, toSkip: 0, errors: 0 };
  const warnings: string[] = [];

  for (const parsed of schedules) {
    const category = await resolveCategory(input.championshipId, input.categoryId, parsed);
    const resolver = await buildResolverForCategory(category.id, parsed);
    const participants = await loadParticipantsFromCategory(category.id);
    warnings.push(...parsed.warnings);

    const rows: MatchImportPreviewRow[] = [];

    for (const m of parsed.matches) {
      const result = await resolveMatchContext(
        category.id,
        category.slug,
        parsed.categoryHint,
        m,
        resolver,
        participants,
        filters
      );

      if (result.kind === "skip") {
        const row: MatchImportPreviewRow = {
          matchNumber: m.matchNumber,
          categoryHint: parsed.categoryHint,
          groupName: groupForClubs(resolver, participants, m.homeRaw, m.awayRaw),
          roundNumber: m.roundNumber,
          phaseName: m.phaseName,
          turnName: m.turnName,
          homeName: resolver.resolve(m.homeRaw),
          awayName: resolver.resolve(m.awayRaw),
          scheduledAt: m.scheduledAt.toISOString(),
          venueName: m.venueName,
          status: result.status,
          message: result.reason,
        };
        rows.push(row);
        if (result.status === "error") totals.errors++;
        else totals.toSkip++;
        continue;
      }

      const ctx = result.ctx;
      const { status, message } = await classifyMatch(input.championshipId, ctx);
      rows.push({
        matchNumber: m.matchNumber,
        categoryHint: parsed.categoryHint,
        groupName: ctx.groupName,
        roundNumber: m.roundNumber,
        phaseName: m.phaseName,
        turnName: m.turnName,
        homeName: ctx.homeName,
        awayName: ctx.awayName,
        scheduledAt: m.scheduledAt.toISOString(),
        venueName: m.venueName,
        status,
        message,
      });

      if (status === "create") totals.toCreate++;
      else if (status === "update") totals.toUpdate++;
      else totals.toSkip++;
    }

    categories.push({
      categoryHint: parsed.categoryHint,
      categoryId: category.id,
      categoryName: category.name,
      matchCountInPdf: parsed.matches.length,
      rows,
    });
  }

  return {
    championshipId: championship.id,
    championshipName: championship.name,
    filters,
    detectedCategories,
    categories,
    totals,
    warnings: [...new Set(warnings)],
  };
}

async function appendLog(
  importId: string,
  level: ScheduleImportLogLevel,
  message: string,
  metadata?: Record<string, unknown>
) {
  await prisma.scheduleImportLog.create({
    data: {
      importId,
      level,
      message,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

export async function runScheduleMatchesImport(input: RunMatchesImportInput) {
  const championship = await prisma.championship.findUnique({
    where: { id: input.championshipId },
  });
  if (!championship) throw new Error("Campeonato não encontrado.");

  const preview = await previewScheduleMatchesImport(input);
  const summary = emptySummary();
  summary.warnings = preview.warnings;

  const importRecord = await prisma.scheduleImport.create({
    data: {
      championshipId: input.championshipId,
      categoryId: preview.categories[0]?.categoryId ?? null,
      fileName: input.fileName,
      status: "PROCESSING",
      createdById: input.createdById ?? null,
      startedAt: new Date(),
    },
  });

  const log = (level: ScheduleImportLogLevel, message: string, metadata?: Record<string, unknown>) => {
    void appendLog(importRecord.id, level, message, metadata);
  };

  try {
    log("INFO", "Importação de jogos (somente partidas)", {
      filters: input.filters,
      totals: preview.totals,
    });

    const text = await extractTextFromPdf(input.buffer);
    const allSchedules = parseFpPaulistaSchedules(text);

    for (const catBlock of preview.categories) {
      const parsed = filterParsedSchedule(
        allSchedules.find((s) => categoryHintsMatch(s.categoryHint, catBlock.categoryHint))!,
        input.filters
      );

      const category = await prisma.category.findUniqueOrThrow({
        where: { id: catBlock.categoryId },
      });
      const resolver = await buildResolverForCategory(category.id, parsed);
      const participants = await loadParticipantsFromCategory(category.id);

      for (const m of parsed.matches) {
        const ctxResult = await resolveMatchContext(
          category.id,
          category.slug,
          parsed.categoryHint,
          m,
          resolver,
          participants,
          input.filters
        );

        if (ctxResult.kind === "skip") {
          if (ctxResult.status === "error") {
            summary.errors++;
            log("ERROR", ctxResult.reason, { matchNumber: m.matchNumber });
          } else {
            summary.matchesIgnored++;
            summary.matchesSkippedDuplicate++;
          }
          continue;
        }

        const ctx = ctxResult.ctx;
        const { status } = await classifyMatch(input.championshipId, ctx);

        if (status === "skip_duplicate") {
          summary.matchesIgnored++;
          summary.matchesSkippedDuplicate++;
          log("INFO", "Jogo ignorado (duplicado)", { matchNumber: m.matchNumber });
          continue;
        }

        try {
          const phaseR = await findOrCreatePhase(
            input.championshipId,
            m.phaseName,
            m.phaseSlug
          );
          if (phaseR.created) summary.phasesCreated++;
          else summary.phasesReused++;

          const turnR = await findOrCreateTurn(phaseR.phase.id, m.turnName, m.turnSlug);
          if (turnR.created) summary.turnsCreated++;
          else summary.turnsReused++;

          const roundLabel = `Rodada ${String(m.roundNumber).padStart(2, "0")}`;
          const roundR = await findOrCreateRound(
            input.championshipId,
            phaseR.phase.id,
            turnR.turn.id,
            m.roundNumber,
            roundLabel
          );
          if (roundR.created) summary.roundsCreated++;
          else summary.roundsReused++;

          const venueR = await findOrCreateVenue(m.venueName);
          if (venueR.created) summary.venuesCreated++;
          else summary.venuesReused++;

          const fingerprint = buildMatchImportFingerprint({
            championshipId: input.championshipId,
            categorySlug: category.slug,
            phaseSlug: m.phaseSlug,
            turnSlug: m.turnSlug,
            roundNumber: m.roundNumber,
            scheduledAt: m.scheduledAt,
            homeClubId: ctx.homeClubId,
            awayClubId: ctx.awayClubId,
          });

          const existing = await findExistingImportedMatch({
            championshipId: input.championshipId,
            categorySlug: category.slug,
            categoryId: category.id,
            phaseSlug: m.phaseSlug,
            turnSlug: m.turnSlug,
            roundNumber: m.roundNumber,
            scheduledAt: m.scheduledAt,
            homeClubId: ctx.homeClubId,
            awayClubId: ctx.awayClubId,
          });

          if (existing && status === "update") {
            await prisma.match.update({
              where: { id: existing.id },
              data: {
                scheduledAt: m.scheduledAt,
                venue: m.venueName,
                venueId: venueR.id,
                matchNumber: m.matchNumber,
                round: m.roundNumber,
                phaseId: phaseR.phase.id,
                turnId: turnR.turn.id,
                competitionRoundId: roundR.round.id,
                importFingerprint: fingerprint,
              },
            });
            summary.matchesUpdated++;
            summary.matchesImported++;
            log("INFO", `Jogo atualizado #${m.matchNumber}`, { matchId: existing.id });
          } else if (!existing) {
            await prisma.match.create({
              data: {
                championshipId: input.championshipId,
                groupId: ctx.groupId,
                homeTeamId: ctx.homeTeamId,
                awayTeamId: ctx.awayTeamId,
                homeClubId: ctx.homeClubId,
                awayClubId: ctx.awayClubId,
                phaseId: phaseR.phase.id,
                turnId: turnR.turn.id,
                competitionRoundId: roundR.round.id,
                matchNumber: m.matchNumber,
                round: m.roundNumber,
                scheduledAt: m.scheduledAt,
                venue: m.venueName,
                venueId: venueR.id,
                importFingerprint: fingerprint,
                status: "SCHEDULED",
              },
            });
            summary.matchesCreated++;
            summary.matchesImported++;
            log("INFO", `Jogo criado #${m.matchNumber}`, {
              home: ctx.homeName,
              away: ctx.awayName,
            });
          }
        } catch (e) {
          summary.errors++;
          log("ERROR", `Falha no jogo #${m.matchNumber}`, {
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
    }

    summary.matchesImported =
      (summary.matchesCreated ?? 0) + (summary.matchesUpdated ?? 0);

    await prisma.scheduleImport.update({
      where: { id: importRecord.id },
      data: {
        status: summary.errors > 0 && summary.matchesImported === 0 ? "FAILED" : "COMPLETED",
        summary: summary as unknown as Prisma.InputJsonValue,
        finishedAt: new Date(),
      },
    });

    return {
      importId: importRecord.id,
      summary,
      preview,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro desconhecido";
    await appendLog(importRecord.id, "ERROR", message);
    await prisma.scheduleImport.update({
      where: { id: importRecord.id },
      data: {
        status: "FAILED",
        summary: { errors: 1, message } as Prisma.InputJsonValue,
        finishedAt: new Date(),
      },
    });
    throw e;
  }
}
