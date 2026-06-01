import { prisma } from "@/lib/prisma";
import type { MatchStatus } from "@prisma/client";

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
    select: { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true, scheduledAt: true },
    orderBy: { scheduledAt: "asc" },
  });

  for (const m of matches) {
    applyResult(stats, m.homeTeamId, m.awayTeamId, m.homeScore, m.awayScore);
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

  const sortedTeamIds = new Set(sorted.map((s) => s.teamId));

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    const form = s.form.slice(-5).join("");
    await prisma.standingRow.upsert({
      where: {
        standingId_teamId: { standingId: standing.id, teamId: s.teamId },
      },
      create: {
        standingId: standing.id,
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
      standingId: standing.id,
      teamId: { notIn: [...sortedTeamIds] },
    },
  });

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
  return results;
}

/** Recalcula tabelas de todos os grupos de um campeonato. */
export async function recalculateStandingsForChampionship(championshipId: string) {
  const categories = await prisma.category.findMany({
    where: { championshipId },
    select: { id: true, name: true },
  });
  const out: { categoryId: string; categoryName: string; groups: Awaited<ReturnType<typeof recalculateStandingsForCategory>> }[] = [];
  for (const cat of categories) {
    out.push({
      categoryId: cat.id,
      categoryName: cat.name,
      groups: await recalculateStandingsForCategory(cat.id),
    });
  }
  return out;
}
