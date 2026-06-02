import { penaltyShootoutWinner } from "@/lib/match-penalties";
import { prisma } from "@/lib/prisma";
import type { MatchStatus } from "@prisma/client";
import type { StandingRowDisplay } from "@/types";

type FinishedMatchForStandings = {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  homePenaltyScore: number;
  awayPenaltyScore: number;
};

type MutableStanding = {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: ("W" | "D" | "L")[];
};

const COUNTED: MatchStatus[] = ["FINISHED"];

function initStats(teamIds: string[]): Map<string, MutableStanding> {
  const map = new Map<string, MutableStanding>();
  for (const teamId of teamIds) {
    map.set(teamId, {
      teamId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      form: [],
    });
  }
  return map;
}

function applyResult(
  stats: Map<string, MutableStanding>,
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number,
  awayScore: number
) {
  const home = stats.get(homeTeamId);
  const away = stats.get(awayTeamId);
  if (!home || !away) return;

  home.played += 1;
  away.played += 1;
  home.goalsFor += homeScore;
  home.goalsAgainst += awayScore;
  away.goalsFor += awayScore;
  away.goalsAgainst += homeScore;

  if (homeScore > awayScore) {
    home.won += 1;
    home.points += 3;
    away.lost += 1;
    home.form.push("W");
    away.form.push("L");
  } else if (awayScore > homeScore) {
    away.won += 1;
    away.points += 3;
    home.lost += 1;
    away.form.push("W");
    home.form.push("L");
  } else {
    home.drawn += 1;
    away.drawn += 1;
    home.points += 1;
    away.points += 1;
    home.form.push("D");
    away.form.push("D");
  }
}

/** +1 ponto na classificação para o vencedor da disputa de pênaltis (Paulista de base). */
function applyPenaltyBonus(
  stats: Map<string, MutableStanding>,
  homeTeamId: string,
  awayTeamId: string,
  homePenaltyScore: number,
  awayPenaltyScore: number
) {
  if (homePenaltyScore + awayPenaltyScore <= 0) return;
  const result = penaltyShootoutWinner(homePenaltyScore, awayPenaltyScore);
  const winnerId =
    result === "home" ? homeTeamId : result === "away" ? awayTeamId : null;
  if (!winnerId) return;
  const row = stats.get(winnerId);
  if (row) row.points += 1;
}

function applyFinishedMatch(
  stats: Map<string, MutableStanding>,
  match: FinishedMatchForStandings
) {
  applyResult(
    stats,
    match.homeTeamId,
    match.awayTeamId,
    match.homeScore,
    match.awayScore
  );
  applyPenaltyBonus(
    stats,
    match.homeTeamId,
    match.awayTeamId,
    match.homePenaltyScore,
    match.awayPenaltyScore
  );
}

const matchStandingsSelect = {
  homeTeamId: true,
  awayTeamId: true,
  homeScore: true,
  awayScore: true,
  homePenaltyScore: true,
  awayPenaltyScore: true,
} as const;

function sortRows(rows: MutableStanding[]): MutableStanding[] {
  return [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamId.localeCompare(b.teamId);
  });
}

async function mutableToDisplayRows(sorted: MutableStanding[]): Promise<StandingRowDisplay[]> {
  if (sorted.length === 0) return [];
  const teams = await prisma.team.findMany({
    where: { id: { in: sorted.map((s) => s.teamId) } },
    include: { club: { select: { name: true, crestUrl: true } } },
  });
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  return sorted.map((s, index) => {
    const team = teamMap.get(s.teamId);
    return {
      position: index + 1,
      teamName: team?.club.name ?? "—",
      crestUrl: team?.club.crestUrl ?? null,
      played: s.played,
      won: s.won,
      drawn: s.drawn,
      lost: s.lost,
      goalsFor: s.goalsFor,
      goalsAgainst: s.goalsAgainst,
      points: s.points,
      form: s.form.slice(-5).join("") || null,
    };
  });
}

/** Calcula classificação de um grupo a partir dos jogos finalizados (sem gravar). */
export async function computeStandingsForGroup(groupId: string): Promise<StandingRowDisplay[]> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { teams: { select: { id: true } } },
  });
  if (!group) return [];

  const stats = initStats(group.teams.map((t) => t.id));
  const matches = await prisma.match.findMany({
    where: { groupId, status: { in: COUNTED } },
    select: matchStandingsSelect,
    orderBy: { scheduledAt: "asc" },
  });

  for (const m of matches) {
    applyFinishedMatch(stats, m);
  }

  return mutableToDisplayRows(sortRows([...stats.values()]));
}

async function buildCategoryStandingsSorted(categoryId: string): Promise<MutableStanding[]> {
  const teams = await prisma.team.findMany({
    where: { group: { categoryId } },
    select: { id: true },
  });
  if (teams.length === 0) return [];

  const stats = initStats(teams.map((t) => t.id));
  const matches = await prisma.match.findMany({
    where: { group: { categoryId }, status: { in: COUNTED } },
    select: matchStandingsSelect,
    orderBy: { scheduledAt: "asc" },
  });

  for (const m of matches) {
    applyFinishedMatch(stats, m);
  }

  return sortRows([...stats.values()]);
}

/** Classificação geral da categoria (todos os grupos e jogos finalizados). */
export async function computeStandingsForCategory(categoryId: string): Promise<StandingRowDisplay[]> {
  return mutableToDisplayRows(await buildCategoryStandingsSorted(categoryId));
}

async function persistStandingRows(
  standingId: string,
  sorted: MutableStanding[]
): Promise<void> {
  const sortedTeamIds = new Set(sorted.map((s) => s.teamId));

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    const form = s.form.slice(-5).join("");
    await prisma.standingRow.upsert({
      where: {
        standingId_teamId: { standingId, teamId: s.teamId },
      },
      create: {
        standingId,
        teamId: s.teamId,
        position: i + 1,
        played: s.played,
        won: s.won,
        drawn: s.drawn,
        lost: s.lost,
        goalsFor: s.goalsFor,
        goalsAgainst: s.goalsAgainst,
        points: s.points,
        form: form || null,
      },
      update: {
        position: i + 1,
        played: s.played,
        won: s.won,
        drawn: s.drawn,
        lost: s.lost,
        goalsFor: s.goalsFor,
        goalsAgainst: s.goalsAgainst,
        points: s.points,
        form: form || null,
      },
    });
  }

  await prisma.standingRow.deleteMany({
    where: {
      standingId,
      teamId: { notIn: [...sortedTeamIds] },
    },
  });
}

/** Recalcula a tabela de um grupo a partir dos jogos finalizados. */
export async function recalculateStandingsForGroup(groupId: string): Promise<{ standingId: string; teams: number }> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { teams: { select: { id: true } } },
  });
  if (!group) throw new Error(`Grupo não encontrado: ${groupId}`);

  const teamIds = group.teams.map((t) => t.id);
  const stats = initStats(teamIds);

  const matches = await prisma.match.findMany({
    where: { groupId, status: { in: COUNTED } },
    select: matchStandingsSelect,
    orderBy: { scheduledAt: "asc" },
  });

  for (const m of matches) {
    applyFinishedMatch(stats, m);
  }

  const sorted = sortRows([...stats.values()]);

  const standing = await prisma.standing.upsert({
    where: { groupId },
    create: {
      categoryId: group.categoryId,
      groupId,
      name: group.name,
    },
    update: { name: group.name },
  });

  await persistStandingRows(standing.id, sorted);

  return { standingId: standing.id, teams: sorted.length };
}

/** Recalcula a classificação geral (todos os grupos) de uma categoria. */
export async function recalculateGeneralStandingsForCategory(
  categoryId: string
): Promise<{ standingId: string; teams: number }> {
  const sorted = await buildCategoryStandingsSorted(categoryId);

  let standing = await prisma.standing.findFirst({
    where: { categoryId, groupId: null },
    orderBy: { updatedAt: "desc" },
  });
  if (!standing) {
    standing = await prisma.standing.create({
      data: {
        categoryId,
        groupId: null,
        name: "Classificação geral",
      },
    });
  } else {
    standing = await prisma.standing.update({
      where: { id: standing.id },
      data: { name: "Classificação geral" },
    });
  }

  await persistStandingRows(standing.id, sorted);
  return { standingId: standing.id, teams: sorted.length };
}

/** Recalcula todas as tabelas por grupo de uma categoria. */
export async function recalculateStandingsForCategory(categoryId: string) {
  const groups = await prisma.group.findMany({
    where: { categoryId },
    select: { id: true, name: true },
  });
  const results = [];
  for (const g of groups) {
    results.push({ groupId: g.id, groupName: g.name, ...(await recalculateStandingsForGroup(g.id)) });
  }
  const general = await recalculateGeneralStandingsForCategory(categoryId);
  return { groups: results, general };
}

/** Recalcula tabelas de todos os grupos de um campeonato. */
export async function recalculateStandingsForChampionship(championshipId: string) {
  const categories = await prisma.category.findMany({
    where: { championshipId },
    select: { id: true, name: true },
  });
  const out: {
    categoryId: string;
    categoryName: string;
    standings: Awaited<ReturnType<typeof recalculateStandingsForCategory>>;
  }[] = [];
  for (const cat of categories) {
    out.push({
      categoryId: cat.id,
      categoryName: cat.name,
      standings: await recalculateStandingsForCategory(cat.id),
    });
  }
  return out;
}
