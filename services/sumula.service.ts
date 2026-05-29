import { prisma } from "@/lib/prisma";
import { STAFF_ROLE_LABELS } from "@/lib/admin-labels";
import { sumulaMetaSchema, type SumulaMeta } from "@/lib/sumula-types";
import { formatDate, formatTime } from "@/lib/utils";
import type { LineupRole, MatchEventType, StaffRole } from "@prisma/client";

export type SumulaPlayerRow = {
  number: number | null;
  name: string;
  role: "T" | "R";
  proAmateur: "A";
  registration: string;
};

export type SumulaStaffRow = {
  role: string;
  name: string;
};

export type SumulaSubstitutionRow = {
  teamName: string;
  outNumber: string;
  outName: string;
  inNumber: string;
  inName: string;
  time: string;
  period: string;
};

export type SumulaDisciplinaryRow = {
  teamName: string;
  number: string;
  playerName: string;
  time: string;
  period: string;
  card: "CA" | "CV";
  reason: string;
};

export type SumulaGoalRow = {
  teamName: string;
  number: string;
  playerName: string;
  type: string;
  time: string;
  period: string;
};

export type MatchSumulaData = {
  matchId: string;
  gameNumber: string;
  seasonYear: number;
  championshipLabel: string;
  categoryLabel: string;
  roundLabel: string;
  homeName: string;
  awayName: string;
  matchTitle: string;
  date: string;
  time: string;
  venue: string;
  homeScore: number;
  awayScore: number;
  publishedAt: string;
  arbitration: SumulaMeta;
  homePlayers: SumulaPlayerRow[];
  awayPlayers: SumulaPlayerRow[];
  homeStaff: SumulaStaffRow[];
  awayStaff: SumulaStaffRow[];
  substitutions: SumulaSubstitutionRow[];
  goals: SumulaGoalRow[];
  cautions: SumulaDisciplinaryRow[];
  expulsions: SumulaDisciplinaryRow[];
  chronologyLines: string[];
  hasCautions: boolean;
  hasExpulsions: boolean;
  hasSubstitutions: boolean;
  observations: string;
};

function parseSumulaMeta(raw: unknown): SumulaMeta {
  const parsed = sumulaMetaSchema.safeParse(raw);
  return parsed.success ? parsed.data : {};
}

function registrationCode(athleteId: string): string {
  return athleteId.slice(-8).toUpperCase();
}

function inferPeriod(
  minute: number,
  type: MatchEventType,
  description: string | null | undefined,
  halfEndedAt: number | null
): string {
  if (/terceiro/i.test(description ?? "")) return "3T";
  if (halfEndedAt != null && minute >= halfEndedAt) return "2T";
  if (minute > 45) return "2T";
  return "1T";
}

function formatEventTime(minute: number, extraMinute?: number | null): string {
  const base = `${String(minute).padStart(2, "0")}:00`;
  if (extraMinute && extraMinute > 0) return `${base}+${extraMinute}`;
  return base;
}

function goalTypeLabel(type: MatchEventType, description?: string | null): string {
  if (type === "PENALTY_GOAL") return "PN";
  if (type === "OWN_GOAL") return "CT";
  if (/falta/i.test(description ?? "")) return "FT";
  return "NR";
}

function mapStaff(clubStaff: { name: string; role: StaffRole }[]): SumulaStaffRow[] {
  const order: StaffRole[] = [
    "HEAD_COACH",
    "ASSISTANT_COACH",
    "GOALKEEPER_COACH",
    "PHYSIO",
    "ANALYST",
    "MANAGER",
  ];
  return order
    .map((role) => clubStaff.find((s) => s.role === role))
    .filter(Boolean)
    .map((s) => ({
      role: STAFF_ROLE_LABELS[s!.role] ?? s!.role,
      name: s!.name,
    }));
}

function parseSubstitution(description: string): { out?: string; in?: string } {
  const outMatch = description.match(/saiu[:\s]+([^|]+)/i);
  const inMatch = description.match(/entrou[:\s]+([^|]+)/i);
  if (outMatch || inMatch) {
    return { out: outMatch?.[1]?.trim(), in: inMatch?.[1]?.trim() };
  }
  const parts = description.split(/\s*[-|→]\s*/);
  if (parts.length >= 2) {
    return { out: parts[0]?.trim(), in: parts[1]?.trim() };
  }
  return {};
}

export async function getMatchSumula(matchId: string): Promise<MatchSumulaData | null> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: { include: { club: true } },
      awayTeam: { include: { club: true } },
      group: { include: { category: { include: { championship: true } } } },
      competitionRound: true,
      venueRef: true,
      events: {
        orderBy: [{ minute: "asc" }, { createdAt: "asc" }],
        include: { athlete: true },
      },
      lineups: {
        include: { athlete: true },
      },
    },
  });

  if (!match) return null;

  const [homeStaffRaw, awayStaffRaw] = await Promise.all([
    prisma.staffMember.findMany({
      where: { clubId: match.homeTeam.clubId, status: "ACTIVE" },
    }),
    prisma.staffMember.findMany({
      where: { clubId: match.awayTeam.clubId, status: "ACTIVE" },
    }),
  ]);

  const meta = parseSumulaMeta(match.sumulaMeta);
  const championship = match.group.category.championship;
  const category = match.group.category;

  const mapPlayers = (teamId: string): SumulaPlayerRow[] =>
    match.lineups
      .filter((l) => l.teamId === teamId)
      .sort((a, b) => {
        const roleOrder = (r: LineupRole) => (r === "STARTER" ? 0 : 1);
        if (roleOrder(a.role) !== roleOrder(b.role)) return roleOrder(a.role) - roleOrder(b.role);
        return (a.shirtNumber ?? 99) - (b.shirtNumber ?? 99);
      })
      .map((l) => ({
        number: l.shirtNumber ?? l.athlete.shirtNumber,
        name: `${l.athlete.firstName} ${l.athlete.lastName}`.trim(),
        role: l.role === "STARTER" ? "T" : "R",
        proAmateur: "A" as const,
        registration: registrationCode(l.athlete.id),
      }));

  const halfEvent = match.events.find((e) => e.type === "HALFTIME");
  const halfEndedAt = halfEvent?.minute ?? null;

  const teamName = (teamId: string | null | undefined) => {
    if (teamId === match.homeTeamId) return match.homeTeam.club.name;
    if (teamId === match.awayTeamId) return match.awayTeam.club.name;
    return "—";
  };

  const goals: SumulaGoalRow[] = [];
  const cautions: SumulaDisciplinaryRow[] = [];
  const expulsions: SumulaDisciplinaryRow[] = [];
  const substitutions: SumulaSubstitutionRow[] = [];
  const chronologyLines: string[] = [];

  for (const e of match.events) {
    const period = inferPeriod(e.minute, e.type, e.description, halfEndedAt);
    const time = formatEventTime(e.minute, e.extraMinute);
    const athleteName = e.athlete
      ? `${e.athlete.firstName} ${e.athlete.lastName}`.trim()
      : (e.description ?? "—");

    if (e.type === "KICKOFF") {
      chronologyLines.push(
        `${e.description ?? "Início"}: ${formatTime(match.scheduledAt)} · ${period}`
      );
    } else if (e.type === "HALFTIME") {
      chronologyLines.push(`Término 1º Tempo: ${time} · Acrésc: 0 min`);
    } else if (e.type === "FULLTIME") {
      chronologyLines.push(`Encerramento: ${time}`);
    } else if (
      e.type === "GOAL" ||
      e.type === "PENALTY_GOAL" ||
      e.type === "OWN_GOAL"
    ) {
      goals.push({
        teamName: teamName(e.teamId),
        number: e.athlete?.shirtNumber != null ? String(e.athlete.shirtNumber) : "—",
        playerName: athleteName,
        type: goalTypeLabel(e.type, e.description),
        time,
        period,
      });
    } else if (e.type === "YELLOW_CARD") {
      cautions.push({
        teamName: teamName(e.teamId),
        number: e.athlete?.shirtNumber != null ? String(e.athlete.shirtNumber) : "—",
        playerName: athleteName,
        time,
        period,
        card: "CA",
        reason: e.description ?? "Cartão amarelo",
      });
    } else if (e.type === "RED_CARD") {
      expulsions.push({
        teamName: teamName(e.teamId),
        number: e.athlete?.shirtNumber != null ? String(e.athlete.shirtNumber) : "—",
        playerName: athleteName,
        time,
        period,
        card: "CV",
        reason: e.description ?? "Cartão vermelho",
      });
    } else if (e.type === "SUBSTITUTION") {
      const parsed = parseSubstitution(e.description ?? "");
      substitutions.push({
        teamName: teamName(e.teamId),
        outNumber: "—",
        outName: parsed.out ?? "—",
        inNumber: "—",
        inName: parsed.in ?? e.description ?? "—",
        time: time === "00:00" ? "—" : time,
        period,
      });
    }
  }

  const venue =
    match.venueRef?.name && match.venueRef.city
      ? `${match.venueRef.name} / ${match.venueRef.city}`
      : match.venue ?? match.venueRef?.name ?? "—";

  const roundLabel = match.competitionRound?.label
    ? match.competitionRound.label.replace(/^rodada\s*/i, "")
    : String(match.round).padStart(2, "0");

  return {
    matchId: match.id,
    gameNumber: match.matchNumber != null ? String(match.matchNumber) : "—",
    seasonYear: Number.parseInt(championship.season, 10) || new Date().getFullYear(),
    championshipLabel: championship.name,
    categoryLabel: category.name,
    roundLabel,
    homeName: match.homeTeam.club.name,
    awayName: match.awayTeam.club.name,
    matchTitle: `${match.homeTeam.club.name} X ${match.awayTeam.club.name}`,
    date: formatDate(match.scheduledAt, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    time: formatTime(match.scheduledAt),
    venue,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    publishedAt: formatDate(new Date(), {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    arbitration: meta,
    homePlayers: mapPlayers(match.homeTeamId),
    awayPlayers: mapPlayers(match.awayTeamId),
    homeStaff: mapStaff(homeStaffRaw),
    awayStaff: mapStaff(awayStaffRaw),
    substitutions,
    goals,
    cautions,
    expulsions,
    chronologyLines,
    hasCautions: cautions.length > 0,
    hasExpulsions: expulsions.length > 0,
    hasSubstitutions: substitutions.length > 0,
    observations:
      meta.observations?.trim() ||
      "NADA HOUVE DE ANORMAL.",
  };
}

export async function updateMatchSumulaMeta(
  matchId: string,
  meta: SumulaMeta
): Promise<void> {
  const parsed = sumulaMetaSchema.parse(meta);
  await prisma.match.update({
    where: { id: matchId },
    data: { sumulaMeta: parsed },
  });
}
