import type { Prisma, ScheduleImportLogLevel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildMatchImportFingerprint } from "@/lib/match-import-fingerprint";
import { findExistingImportedMatch } from "@/services/schedule-import/find-existing-match";
import { findExistingClub, pickCanonicalClubName } from "@/lib/club-lookup";
import {
  formatClubDisplayName,
  isMostlyUppercase,
  normalizeClubName,
  normalizeEntityName,
} from "@/lib/normalize-name";
import { slugify } from "@/lib/utils";
import { extractTextFromPdf } from "@/services/schedule-import/pdf-text";
import {
  ClubNameResolver,
  groupForClubs,
  parseFpPaulistaSchedules,
  type ParsedFpSchedule,
} from "@/services/schedule-import/fp-paulista-parser";

export type ScheduleImportSummary = {
  clubsCreated: number;
  clubsReused: number;
  venuesCreated: number;
  venuesReused: number;
  groupsCreated: number;
  groupsReused: number;
  phasesCreated: number;
  phasesReused: number;
  turnsCreated: number;
  turnsReused: number;
  roundsCreated: number;
  roundsReused: number;
  teamsCreated: number;
  teamsReused: number;
  matchesImported: number;
  matchesCreated: number;
  matchesUpdated: number;
  matchesIgnored: number;
  matchesSkippedDuplicate: number;
  errors: number;
  warnings: string[];
  /** Detalhe por categoria quando o PDF traz Sub-11, Sub-12, etc. */
  byCategory?: Array<{
    categoryHint: string;
    categoryId: string;
    matchesImported: number;
    matchesSkippedDuplicate: number;
    errors: number;
  }>;
};

export type CategoryImportResult = {
  categoryHint: string;
  categoryId: string;
  categoryName: string;
  summary: ScheduleImportSummary;
  matchCount: number;
};

function mergeSummaries(parts: ScheduleImportSummary[]): ScheduleImportSummary {
  const merged: ScheduleImportSummary = {
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
    byCategory: [],
  };
  for (const p of parts) {
    merged.clubsCreated += p.clubsCreated;
    merged.clubsReused += p.clubsReused;
    merged.venuesCreated += p.venuesCreated;
    merged.venuesReused += p.venuesReused;
    merged.groupsCreated += p.groupsCreated;
    merged.groupsReused += p.groupsReused;
    merged.phasesCreated += p.phasesCreated;
    merged.phasesReused += p.phasesReused;
    merged.turnsCreated += p.turnsCreated;
    merged.turnsReused += p.turnsReused;
    merged.roundsCreated += p.roundsCreated;
    merged.roundsReused += p.roundsReused;
    merged.teamsCreated += p.teamsCreated;
    merged.teamsReused += p.teamsReused;
    merged.matchesImported += p.matchesImported;
    merged.matchesCreated += p.matchesCreated;
    merged.matchesUpdated += p.matchesUpdated;
    merged.matchesIgnored += p.matchesIgnored;
    merged.matchesSkippedDuplicate += p.matchesSkippedDuplicate;
    merged.errors += p.errors;
    merged.warnings.push(...p.warnings);
  }
  return merged;
}

function categoryHintsMatch(a: string, b: string): boolean {
  return slugify(a) === slugify(b);
}

type LogFn = (level: ScheduleImportLogLevel, message: string, metadata?: Record<string, unknown>) => void;

class ImportCounters {
  summary: ScheduleImportSummary = {
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

  private seen = {
    clubs: new Set<string>(),
    venues: new Set<string>(),
    groups: new Set<string>(),
    phases: new Set<string>(),
    turns: new Set<string>(),
    rounds: new Set<string>(),
    teams: new Set<string>(),
  };

  track(
    kind: keyof typeof this.seen,
    id: string,
    created: boolean,
    field: "clubs" | "venues" | "groups" | "phases" | "turns" | "rounds" | "teams"
  ) {
    const bucket = this.seen[kind];
    if (bucket.has(id)) return;
    bucket.add(id);
    const createdKey = `${field}Created` as keyof ScheduleImportSummary;
    const reusedKey = `${field}Reused` as keyof ScheduleImportSummary;
    if (created) {
      (this.summary[createdKey] as number) += 1;
    } else {
      (this.summary[reusedKey] as number) += 1;
    }
  }
}

export type RunScheduleImportInput = {
  buffer: Buffer;
  fileName: string;
  championshipId: string;
  categoryId?: string;
  createdById?: string;
  autoCreateCategory?: boolean;
  /** Só cadastra clubes, grupos e times — não importa jogos da tabela. */
  participantsOnly?: boolean;
};

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

async function findOrCreateClub(
  name: string,
  city: string | undefined,
  log: LogFn,
  counters: ImportCounters,
  resolver?: ClubNameResolver
): Promise<{ id: string; created: boolean }> {
  const resolvedRaw = resolver ? resolver.resolve(name) : name;
  const existing = await findExistingClub(name, resolver);

  if (existing) {
    counters.track("clubs", existing.id, false, "clubs");
    const canonical = pickCanonicalClubName(existing.name, resolvedRaw);
    const displayCity = city ? formatClubDisplayName(city) : undefined;
    if (existing.name !== canonical || isMostlyUppercase(existing.name)) {
      await prisma.club.update({
        where: { id: existing.id },
        data: {
          name: canonical,
          normalizedName: normalizeClubName(canonical),
          city: displayCity ?? undefined,
        },
      });
    }
    log("INFO", `Clube reutilizado: ${canonical}`, { clubId: existing.id, from: name });
    return { id: existing.id, created: false };
  }

  const displayName = formatClubDisplayName(resolvedRaw);
  const displayCity = city ? formatClubDisplayName(city) : undefined;
  const normalizedName = normalizeClubName(displayName);

  let slug = slugify(displayName);
  const slugTaken = await prisma.club.findUnique({ where: { slug } });
  if (slugTaken) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const club = await prisma.club.create({
    data: {
      name: displayName,
      normalizedName,
      slug,
      city: displayCity ?? null,
      status: "APPROVED",
    },
  });
  counters.track("clubs", club.id, true, "clubs");
  log("INFO", `Clube criado: ${club.name}`, { clubId: club.id, from: name });
  return { id: club.id, created: true };
}

async function findOrCreateVenue(
  venueName: string,
  log: LogFn,
  counters: ImportCounters
): Promise<{ id: string; created: boolean }> {
  const normalizedName = normalizeEntityName(venueName);
  const existing = await prisma.venue.findUnique({ where: { normalizedName } });
  if (existing) {
    counters.track("venues", existing.id, false, "venues");
    return { id: existing.id, created: false };
  }
  const venue = await prisma.venue.create({
    data: { name: venueName.trim(), normalizedName },
  });
  counters.track("venues", venue.id, true, "venues");
  log("INFO", `Local criado: ${venue.name}`, { venueId: venue.id });
  return { id: venue.id, created: true };
}

async function findOrCreateGroup(
  categoryId: string,
  groupName: string,
  log: LogFn,
  counters: ImportCounters
): Promise<{ id: string; created: boolean }> {
  const slug = slugify(groupName);
  const existing = await prisma.group.findFirst({
    where: { categoryId, OR: [{ slug }, { name: groupName }] },
  });
  if (existing) {
    counters.track("groups", existing.id, false, "groups");
    return { id: existing.id, created: false };
  }
  const group = await prisma.group.create({
    data: { categoryId, name: groupName, slug, status: "ACTIVE" },
  });
  counters.track("groups", group.id, true, "groups");
  log("INFO", `Grupo criado: ${groupName}`, { groupId: group.id });
  return { id: group.id, created: true };
}

async function findOrCreatePhase(
  championshipId: string,
  phaseName: string,
  phaseSlug: string,
  log: LogFn,
  counters: ImportCounters
) {
  const existing = await prisma.competitionPhase.findFirst({
    where: { championshipId, OR: [{ slug: phaseSlug }, { name: phaseName }] },
  });
  if (existing) {
    counters.track("phases", existing.id, false, "phases");
    return existing;
  }
  const phase = await prisma.competitionPhase.create({
    data: { championshipId, name: phaseName, slug: phaseSlug },
  });
  counters.track("phases", phase.id, true, "phases");
  log("INFO", `Fase criada: ${phaseName}`, { phaseId: phase.id });
  return phase;
}

async function findOrCreateTurn(
  phaseId: string,
  turnName: string,
  turnSlug: string,
  log: LogFn,
  counters: ImportCounters
) {
  const existing = await prisma.competitionTurn.findFirst({
    where: { phaseId, OR: [{ slug: turnSlug }, { name: turnName }] },
  });
  if (existing) {
    counters.track("turns", existing.id, false, "turns");
    return existing;
  }
  const turn = await prisma.competitionTurn.create({
    data: { phaseId, name: turnName, slug: turnSlug },
  });
  counters.track("turns", turn.id, true, "turns");
  log("INFO", `Turno criado: ${turnName}`, { turnId: turn.id });
  return turn;
}

async function findOrCreateRound(
  championshipId: string,
  phaseId: string,
  turnId: string,
  number: number,
  label: string,
  log: LogFn,
  counters: ImportCounters
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
  if (existing) {
    counters.track("rounds", existing.id, false, "rounds");
    return existing;
  }
  const round = await prisma.competitionRound.create({
    data: {
      championshipId,
      phaseId,
      turnId,
      number,
      label,
    },
  });
  counters.track("rounds", round.id, true, "rounds");
  log("INFO", `Rodada criada: ${label}`, { roundId: round.id });
  return round;
}

async function findOrCreateTeam(
  clubId: string,
  groupId: string,
  log: LogFn,
  counters: ImportCounters
): Promise<{ id: string; created: boolean }> {
  const existing = await prisma.team.findUnique({
    where: { clubId_groupId: { clubId, groupId } },
  });
  if (existing) {
    counters.track("teams", existing.id, false, "teams");
    return { id: existing.id, created: false };
  }
  const team = await prisma.team.create({
    data: { clubId, groupId },
  });
  counters.track("teams", team.id, true, "teams");
  log("INFO", `Equipe vinculada ao grupo`, { teamId: team.id, clubId, groupId });
  return { id: team.id, created: true };
}

async function resolveCategory(
  championshipId: string,
  categoryId: string | undefined,
  parsed: ParsedFpSchedule,
  autoCreate: boolean
) {
  if (categoryId) {
    const cat = await prisma.category.findFirst({
      where: { id: categoryId, championshipId },
    });
    if (!cat) throw new Error("Categoria não encontrada neste campeonato.");
    return cat;
  }
  const slug = slugify(parsed.categoryHint);
  let cat = await prisma.category.findUnique({
    where: { championshipId_slug: { championshipId, slug } },
  });
  if (!cat && autoCreate) {
    cat = await prisma.category.create({
      data: {
        championshipId,
        name: parsed.categoryHint,
        slug,
        status: "ACTIVE",
      },
    });
  }
  if (!cat) {
    throw new Error("Informe uma categoria ou habilite criação automática.");
  }
  return cat;
}

async function importParsedSchedule(
  importId: string,
  championshipId: string,
  categoryId: string,
  categorySlug: string,
  parsed: ParsedFpSchedule,
  options?: { participantsOnly?: boolean }
): Promise<ScheduleImportSummary> {
  const counters = new ImportCounters();
  counters.summary.warnings = [...parsed.warnings];

  const log: LogFn = (level, message, metadata) => {
    void appendLog(importId, level, message, metadata);
  };

  const participantsOnly = options?.participantsOnly === true || parsed.matches.length === 0;

  log("INFO", `Importando categoria ${parsed.categoryHint}`, {
    categoryId,
    matchCount: parsed.matches.length,
    participantsOnly,
    participantCount: parsed.participants.length,
  });

  const resolver = new ClubNameResolver(parsed.participants);
  const clubCache = new Map<string, string>();
  const groupCache = new Map<string, string>();

  for (const p of parsed.participants) {
    try {
      const { id } = await findOrCreateClub(p.fullName, p.city, log, counters, resolver);
      clubCache.set(normalizeClubName(p.fullName), id);
      const groupKey = `${categoryId}:${p.groupName}`;
      let groupId = groupCache.get(groupKey);
      if (!groupId) {
        const g = await findOrCreateGroup(categoryId, p.groupName, log, counters);
        groupId = g.id;
        groupCache.set(groupKey, groupId);
      }
      await findOrCreateTeam(id, groupId, log, counters);
    } catch (e) {
      counters.summary.errors++;
      log("ERROR", `Falha ao cadastrar participante ${p.fullName}`, {
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  if (participantsOnly && parsed.matches.length > 0) {
    log("WARN", `Modo só participantes: ${parsed.matches.length} jogo(s) no PDF foram ignorados.`, {
      categoryHint: parsed.categoryHint,
    });
  }

  if (!participantsOnly) for (const m of parsed.matches) {
    try {
      const homeName = resolver.resolve(m.homeRaw);
      const awayName = resolver.resolve(m.awayRaw);
      const groupName = groupForClubs(resolver, parsed.participants, m.homeRaw, m.awayRaw);

      let homeClubId = clubCache.get(normalizeClubName(homeName));
      if (!homeClubId) {
        const c = await findOrCreateClub(homeName, undefined, log, counters, resolver);
        homeClubId = c.id;
        clubCache.set(normalizeClubName(homeName), homeClubId);
      }

      let awayClubId = clubCache.get(normalizeClubName(awayName));
      if (!awayClubId) {
        const c = await findOrCreateClub(awayName, undefined, log, counters, resolver);
        awayClubId = c.id;
        clubCache.set(normalizeClubName(awayName), awayClubId);
      }

      const groupKey = `${categoryId}:${groupName}`;
      let groupId = groupCache.get(groupKey);
      if (!groupId) {
        const g = await findOrCreateGroup(categoryId, groupName, log, counters);
        groupId = g.id;
        groupCache.set(groupKey, groupId);
      }

      const homeTeam = await findOrCreateTeam(homeClubId, groupId, log, counters);
      const awayTeam = await findOrCreateTeam(awayClubId, groupId, log, counters);

      const phase = await findOrCreatePhase(
        championshipId,
        m.phaseName,
        m.phaseSlug,
        log,
        counters
      );
      const turn = await findOrCreateTurn(phase.id, m.turnName, m.turnSlug, log, counters);
      const roundLabel = `Rodada ${String(m.roundNumber).padStart(2, "0")}`;
      const round = await findOrCreateRound(
        championshipId,
        phase.id,
        turn.id,
        m.roundNumber,
        roundLabel,
        log,
        counters
      );

      const venue = await findOrCreateVenue(m.venueName, log, counters);

      const fingerprint = buildMatchImportFingerprint({
        championshipId,
        categorySlug,
        phaseSlug: m.phaseSlug,
        turnSlug: m.turnSlug,
        roundNumber: m.roundNumber,
        scheduledAt: m.scheduledAt,
        homeClubId,
        awayClubId,
      });

      const existingMatch = await findExistingImportedMatch({
        championshipId,
        categorySlug,
        categoryId,
        phaseSlug: m.phaseSlug,
        turnSlug: m.turnSlug,
        roundNumber: m.roundNumber,
        scheduledAt: m.scheduledAt,
        homeClubId,
        awayClubId,
      });
      if (existingMatch) {
        counters.summary.matchesIgnored++;
        counters.summary.matchesSkippedDuplicate++;
        if (existingMatch.importFingerprint !== fingerprint) {
          await prisma.match.update({
            where: { id: existingMatch.id },
            data: { importFingerprint: fingerprint },
          });
        }
        log("INFO", "Jogo já existente — ignorado", {
          matchNumber: m.matchNumber,
          fingerprint,
          matchId: existingMatch.id,
        });
        continue;
      }

      await prisma.match.create({
        data: {
          championshipId,
          groupId,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          homeClubId,
          awayClubId,
          phaseId: phase.id,
          turnId: turn.id,
          competitionRoundId: round.id,
          matchNumber: m.matchNumber,
          round: m.roundNumber,
          scheduledAt: m.scheduledAt,
          venue: m.venueName,
          venueId: venue.id,
          importFingerprint: fingerprint,
          status: "SCHEDULED",
        },
      });
      counters.summary.matchesImported++;
      counters.summary.matchesCreated++;
      log("INFO", `Jogo importado #${m.matchNumber}`, {
        home: homeName,
        away: awayName,
        scheduledAt: m.scheduledAt.toISOString(),
      });
    } catch (e) {
      counters.summary.errors++;
      log("ERROR", `Erro ao importar jogo #${m.matchNumber}`, {
        error: e instanceof Error ? e.message : String(e),
        line: `${m.homeRaw} x ${m.awayRaw}`,
      });
    }
  }

  return counters.summary;
}

export async function runSchedulePdfImport(input: RunScheduleImportInput) {
  const championship = await prisma.championship.findUnique({
    where: { id: input.championshipId },
  });
  if (!championship) throw new Error("Campeonato não encontrado.");

  const text = await extractTextFromPdf(input.buffer);
  const allSchedules = parseFpPaulistaSchedules(text);
  const detectedCategories = [...new Set(allSchedules.map((s) => s.categoryHint))];

  let schedulesToImport = allSchedules;
  if (input.categoryId) {
    const selected = await prisma.category.findFirst({
      where: { id: input.categoryId, championshipId: input.championshipId },
    });
    if (!selected) throw new Error("Categoria não encontrada neste campeonato.");
    schedulesToImport = allSchedules.filter((s) => categoryHintsMatch(s.categoryHint, selected.name));
    if (schedulesToImport.length === 0) {
      throw new Error(
        `O PDF não contém a categoria "${selected.name}". Encontrado no arquivo: ${detectedCategories.join(", ") || "nenhuma"}. Deixe a categoria em branco para importar todas.`
      );
    }
  }

  const importRecord = await prisma.scheduleImport.create({
    data: {
      championshipId: input.championshipId,
      fileName: input.fileName,
      status: "PROCESSING",
      createdById: input.createdById ?? null,
      startedAt: new Date(),
    },
  });

  try {
    await appendLog(importRecord.id, "INFO", `PDF analisado: ${schedulesToImport.length} categoria(s)`, {
      detectedCategories,
      importing: schedulesToImport.map((s) => s.categoryHint),
      totalMatches: schedulesToImport.reduce((n, s) => n + s.matches.length, 0),
    });

    const categoryResults: CategoryImportResult[] = [];

    for (const parsed of schedulesToImport) {
      const category = await resolveCategory(
        input.championshipId,
        undefined,
        parsed,
        input.autoCreateCategory !== false
      );

      const partSummary = await importParsedSchedule(
        importRecord.id,
        input.championshipId,
        category.id,
        category.slug,
        parsed,
        { participantsOnly: input.participantsOnly }
      );

      partSummary.byCategory = [
        {
          categoryHint: parsed.categoryHint,
          categoryId: category.id,
          matchesImported: partSummary.matchesImported,
          matchesSkippedDuplicate: partSummary.matchesSkippedDuplicate,
          errors: partSummary.errors,
        },
      ];

      categoryResults.push({
        categoryHint: parsed.categoryHint,
        categoryId: category.id,
        categoryName: category.name,
        summary: partSummary,
        matchCount: parsed.matches.length,
      });
    }

    const summary = mergeSummaries(categoryResults.map((c) => c.summary));
    summary.byCategory = categoryResults.map((c) => ({
      categoryHint: c.categoryHint,
      categoryId: c.categoryId,
      matchesImported: c.summary.matchesImported,
      matchesSkippedDuplicate: c.summary.matchesSkippedDuplicate,
      errors: c.summary.errors,
    }));

    const primaryCategoryId = categoryResults[0]?.categoryId ?? null;

    await prisma.scheduleImport.update({
      where: { id: importRecord.id },
      data: { categoryId: primaryCategoryId },
    });

    await prisma.scheduleImport.update({
      where: { id: importRecord.id },
      data: {
        status: summary.errors > 0 && summary.matchesImported === 0 ? "FAILED" : "COMPLETED",
        summary: summary as unknown as Prisma.InputJsonValue,
        finishedAt: new Date(),
      },
    });

    const totalMatches = schedulesToImport.reduce((n, s) => n + s.matches.length, 0);
    const titles = [...new Set(schedulesToImport.map((s) => s.championshipTitle))].join(" · ");

    return {
      importId: importRecord.id,
      summary,
      categories: categoryResults,
      detectedInPdf: detectedCategories,
      parsed: { matchCount: totalMatches, title: titles },
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

export async function getScheduleImport(importId: string) {
  return prisma.scheduleImport.findUnique({
    where: { id: importId },
    include: {
      logs: { orderBy: { createdAt: "asc" } },
      championship: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  });
}

export async function listScheduleImports(championshipId?: string, limit = 20) {
  return prisma.scheduleImport.findMany({
    where: championshipId ? { championshipId } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      championship: { select: { name: true } },
      category: { select: { name: true } },
    },
  });
}
