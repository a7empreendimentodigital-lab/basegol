import type { MatchStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findExistingClub } from "@/lib/club-lookup";
import { normalizeAthleteCategory } from "@/lib/athlete-category";
import { parseCsvBuffer, parseCsvText, pickColumn, type CsvRow } from "@/services/import/csv-parse";
import { parseFlexibleDate } from "@/services/athlete-import/parse-date";
import {
  recalculateStandingsForCategory,
  recalculateStandingsForGroup,
} from "@/services/standings.service";

export type MatchResultsImportRowPreview = {
  line: number;
  matchNumber: number | null;
  homeClub: string;
  awayClub: string;
  scheduledAt: string;
  homeScore: number;
  awayScore: number;
  action: "update" | "skip" | "error";
  message?: string;
};

export type MatchResultsImportSummary = {
  total: number;
  updated: number;
  skipped: number;
  errors: number;
  standingsRecalculated: number;
};

export type MatchResultsImportResult = {
  preview: MatchResultsImportRowPreview[];
  summary: MatchResultsImportSummary;
};

export type MatchResultsImportInput = {
  championshipId: string;
  categoryHint?: string;
  buffer?: Buffer;
  text?: string;
  dryRun?: boolean;
  recalculateStandings?: boolean;
};

function parseStatus(raw: string): MatchStatus {
  const s = raw.trim().toUpperCase();
  if (s === "ADIADO" || s === "POSTPONED") return "POSTPONED";
  if (s === "CANCELADO" || s === "CANCELLED") return "CANCELLED";
  if (s === "AO_VIVO" || s === "LIVE") return "LIVE";
  return "FINISHED";
}

function parseIntScore(raw: string, field: string): number | null {
  if (raw === "") return null;
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

async function resolveCategoryId(
  championshipId: string,
  categoryHint?: string
): Promise<string | null> {
  if (!categoryHint?.trim()) return null;
  const norm = normalizeAthleteCategory(categoryHint);
  const cats = await prisma.category.findMany({
    where: { championshipId },
    select: { id: true, name: true, slug: true },
  });
  const hit =
    cats.find((c) => normalizeAthleteCategory(c.name) === norm) ??
    cats.find((c) => c.slug.includes(norm.toLowerCase().replace(/\s+/g, "-")));
  return hit?.id ?? null;
}

async function findMatchForRow(
  championshipId: string,
  categoryId: string | null,
  row: {
    matchNumber: number | null;
    homeClubId: string;
    awayClubId: string;
    scheduledAt: Date | null;
    roundNumber: number | null;
    groupName: string | null;
  }
) {
  const categoryFilter = categoryId ? { group: { categoryId } } : {};

  if (row.matchNumber != null) {
    const byNumber = await prisma.match.findFirst({
      where: {
        championshipId,
        matchNumber: row.matchNumber,
        homeClubId: row.homeClubId,
        awayClubId: row.awayClubId,
        ...categoryFilter,
      },
      orderBy: { scheduledAt: "asc" },
    });
    if (byNumber) return byNumber;
  }

  if (row.scheduledAt) {
    const byDate = await prisma.match.findFirst({
      where: {
        championshipId,
        scheduledAt: row.scheduledAt,
        homeClubId: row.homeClubId,
        awayClubId: row.awayClubId,
        ...categoryFilter,
      },
    });
    if (byDate) return byDate;
  }

  if (row.roundNumber != null) {
    return prisma.match.findFirst({
      where: {
        championshipId,
        round: row.roundNumber,
        homeClubId: row.homeClubId,
        awayClubId: row.awayClubId,
        ...categoryFilter,
      },
      orderBy: { scheduledAt: "asc" },
    });
  }

  return null;
}

function parseResultRow(row: CsvRow): {
  matchNumber: number | null;
  homeClub: string;
  awayClub: string;
  scheduledAt: Date | null;
  homeScore: number | null;
  awayScore: number | null;
  homePenalty: number | null;
  awayPenalty: number | null;
  status: MatchStatus;
  roundNumber: number | null;
  groupName: string | null;
  notes: string | null;
  error?: string;
} {
  const homeClub = pickColumn(row, "mandante", "home", "home_club", "casa");
  const awayClub = pickColumn(row, "visitante", "away", "away_club", "fora");
  const matchNumRaw = pickColumn(row, "jogo", "match_number", "matchnumber", "numero_jogo", "num");
  const matchNumber = matchNumRaw ? Number(matchNumRaw.replace(/\D/g, "")) : null;
  const dateRaw = pickColumn(row, "data", "scheduled_at", "scheduledat", "data_hora");
  const scheduledAt = parseFlexibleDate(dateRaw);
  const homeScore = parseIntScore(
    pickColumn(row, "placar_casa", "home_score", "gols_casa", "gol_casa", "casa_gols"),
    "home"
  );
  const awayScore = parseIntScore(
    pickColumn(row, "placar_fora", "away_score", "gols_fora", "gol_fora", "fora_gols"),
    "away"
  );
  const homePenalty = parseIntScore(
    pickColumn(row, "pen_casa", "home_penalty", "penaltis_casa"),
    "pen_home"
  );
  const awayPenalty = parseIntScore(
    pickColumn(row, "pen_fora", "away_penalty", "penaltis_fora"),
    "pen_away"
  );
  const status = parseStatus(pickColumn(row, "status", "situacao") || "FINISHED");
  const roundRaw = pickColumn(row, "rodada", "round", "round_number");
  const roundNumber = roundRaw ? Number(roundRaw) : null;
  const groupName = pickColumn(row, "grupo", "group", "group_name") || null;
  const notes = pickColumn(row, "observacoes", "obs", "notes") || null;

  if (!homeClub || !awayClub) {
    return {
      matchNumber,
      homeClub,
      awayClub,
      scheduledAt,
      homeScore,
      awayScore,
      homePenalty,
      awayPenalty,
      status,
      roundNumber,
      groupName,
      notes,
      error: "Mandante e visitante são obrigatórios",
    };
  }

  if (status === "FINISHED" && (homeScore === null || awayScore === null)) {
    return {
      matchNumber,
      homeClub,
      awayClub,
      scheduledAt,
      homeScore,
      awayScore,
      homePenalty,
      awayPenalty,
      status,
      roundNumber,
      groupName,
      notes,
      error: "Placar casa e fora são obrigatórios para jogo finalizado",
    };
  }

  if (!matchNumber && !scheduledAt) {
    return {
      matchNumber,
      homeClub,
      awayClub,
      scheduledAt,
      homeScore,
      awayScore,
      homePenalty,
      awayPenalty,
      status,
      roundNumber,
      groupName,
      notes,
      error: "Informe número do jogo ou data agendada",
    };
  }

  return {
    matchNumber,
    homeClub,
    awayClub,
    scheduledAt,
    homeScore: homeScore ?? 0,
    awayScore: awayScore ?? 0,
    homePenalty,
    awayPenalty,
    status,
    roundNumber,
    groupName,
    notes,
  };
}

export async function previewMatchResultsCsvImport(
  input: MatchResultsImportInput
): Promise<MatchResultsImportResult> {
  return runMatchResultsCsvImport({ ...input, dryRun: true });
}

export async function runMatchResultsCsvImport(
  input: MatchResultsImportInput
): Promise<MatchResultsImportResult> {
  const rows = input.buffer
    ? parseCsvBuffer(input.buffer)
    : parseCsvText(input.text ?? "");
  const dryRun = input.dryRun === true;
  const recalc = input.recalculateStandings !== false;
  const categoryId = await resolveCategoryId(input.championshipId, input.categoryHint);

  const preview: MatchResultsImportRowPreview[] = [];
  const summary: MatchResultsImportSummary = {
    total: rows.length,
    updated: 0,
    skipped: 0,
    errors: 0,
    standingsRecalculated: 0,
  };
  const affectedGroupIds = new Set<string>();
  const affectedCategoryIds = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const line = i + 2;
    const parsed = parseResultRow(rows[i]);
    const base: MatchResultsImportRowPreview = {
      line,
      matchNumber: parsed.matchNumber,
      homeClub: parsed.homeClub,
      awayClub: parsed.awayClub,
      scheduledAt: parsed.scheduledAt?.toISOString() ?? "",
      homeScore: parsed.homeScore ?? 0,
      awayScore: parsed.awayScore ?? 0,
      action: "error",
    };

    if (parsed.error) {
      preview.push({ ...base, message: parsed.error });
      summary.errors += 1;
      continue;
    }

    const home = await findExistingClub(parsed.homeClub);
    const away = await findExistingClub(parsed.awayClub);
    if (!home || !away) {
      preview.push({
        ...base,
        message: !home ? `Mandante não encontrado: ${parsed.homeClub}` : `Visitante não encontrado: ${parsed.awayClub}`,
      });
      summary.errors += 1;
      continue;
    }

    const match = await findMatchForRow(input.championshipId, categoryId, {
      matchNumber: parsed.matchNumber,
      homeClubId: home.id,
      awayClubId: away.id,
      scheduledAt: parsed.scheduledAt,
      roundNumber: parsed.roundNumber,
      groupName: parsed.groupName,
    });

    if (!match) {
      preview.push({
        ...base,
        homeClub: home.name,
        awayClub: away.name,
        message: "Jogo não encontrado (importe a tabela antes)",
      });
      summary.errors += 1;
      continue;
    }

    if (!dryRun) {
      const sumulaMeta =
        parsed.notes != null
          ? {
              ...(typeof match.sumulaMeta === "object" && match.sumulaMeta !== null
                ? (match.sumulaMeta as Record<string, unknown>)
                : {}),
              importNotes: parsed.notes,
            }
          : undefined;

      await prisma.match.update({
        where: { id: match.id },
        data: {
          status: parsed.status,
          homeScore: parsed.homeScore ?? 0,
          awayScore: parsed.awayScore ?? 0,
          ...(parsed.homePenalty != null ? { homePenaltyScore: parsed.homePenalty } : {}),
          ...(parsed.awayPenalty != null ? { awayPenaltyScore: parsed.awayPenalty } : {}),
          ...(sumulaMeta ? { sumulaMeta } : {}),
        },
      });
      affectedGroupIds.add(match.groupId);
      const g = await prisma.group.findUnique({
        where: { id: match.groupId },
        select: { categoryId: true },
      });
      if (g) affectedCategoryIds.add(g.categoryId);
    }

    preview.push({
      ...base,
      homeClub: home.name,
      awayClub: away.name,
      homeScore: parsed.homeScore ?? 0,
      awayScore: parsed.awayScore ?? 0,
      action: "update",
    });
    summary.updated += 1;
  }

  if (!dryRun && recalc) {
    for (const groupId of affectedGroupIds) {
      await recalculateStandingsForGroup(groupId);
      summary.standingsRecalculated += 1;
    }
    if (affectedGroupIds.size === 0 && categoryId) {
      await recalculateStandingsForCategory(categoryId);
      summary.standingsRecalculated = 1;
    }
  }

  return { preview: preview.slice(0, 500), summary };
}
