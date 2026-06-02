import { buildClubAliasKeys } from "@/lib/match-import-fingerprint";
import { normalizeAthleteCategory } from "@/lib/athlete-category";
import { applyCategoryMatchTime } from "@/lib/category-match-times";
import type { PaulistaFixture, PaulistaGroupTeam, PaulistaPack } from "@/services/paulista-pack-import/paulista-pack.types";
import type { ParsedFpSchedule, ParsedParticipantClub, ParsedScheduleMatch } from "@/services/schedule-import/fp-paulista-parser";

const MONTHS: Record<string, number> = {
  jan: 0,
  fev: 1,
  mar: 2,
  abr: 3,
  mai: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  set: 8,
  out: 9,
  nov: 10,
  dez: 11,
};

export function formatPaulistaGroupName(groupNum: number): string {
  return `Grupo ${String(groupNum).padStart(2, "0")}`;
}

function parseFixtureDateTime(date: string, time: string, seasonYear: number): Date | null {
  const dm = date.trim().match(/^(\d{1,2})\/(\w{3})/i);
  if (!dm) return null;
  const mon = MONTHS[dm[2].toLowerCase().slice(0, 3)];
  if (mon === undefined) return null;
  const tm = time.trim().match(/(\d{1,2})\s*h\s*(\d{1,2})/i);
  const hour = tm ? Number(tm[1]) : 0;
  const minute = tm ? Number(tm[2]) : 0;
  return new Date(seasonYear, mon, Number(dm[1]), hour, minute, 0, 0);
}

function participantFromGroupTeam(gt: PaulistaGroupTeam): ParsedParticipantClub {
  const aliases = new Set<string>();
  for (const key of buildClubAliasKeys(gt.official_name)) aliases.add(key);
  for (const key of buildClubAliasKeys(gt.alias)) aliases.add(key);
  return {
    fullName: gt.official_name,
    groupName: formatPaulistaGroupName(gt.group),
    aliases: [...aliases],
  };
}

function fixtureToMatch(
  f: PaulistaFixture,
  seasonYear: number,
  categoryHint: string,
  warnings: string[]
): ParsedScheduleMatch | null {
  const parsed = parseFixtureDateTime(f.date, f.time, seasonYear);
  if (!parsed) {
    warnings.push(`Data/hora inválida no jogo #${f.match_number}: ${f.date} ${f.time}`);
    return null;
  }
  const scheduledAt = applyCategoryMatchTime(parsed, categoryHint);
  return {
    matchNumber: f.match_number,
    roundNumber: f.round,
    phaseName: "FASE 01",
    phaseSlug: "fase-01",
    turnName: "PRIMEIRO TURNO",
    turnSlug: "primeiro-turno",
    homeRaw: f.home_alias || f.home_official,
    awayRaw: f.away_alias || f.away_official,
    venueName: f.venue,
    scheduledAt,
  };
}

/** Converte pacote FPF em schedules por categoria (Sub-11, Sub-12). */
export function paulistaPackToSchedules(pack: PaulistaPack): ParsedFpSchedule[] {
  const categories = [...new Set(pack.groupTeams.map((g) => normalizeAthleteCategory(g.competition_category)))];
  const schedules: ParsedFpSchedule[] = [];

  for (const categoryHint of categories) {
    const warnings: string[] = [];
    const participants = pack.groupTeams
      .filter((g) => normalizeAthleteCategory(g.competition_category) === categoryHint)
      .map(participantFromGroupTeam);

    const comp = pack.competitions.find((c) => normalizeAthleteCategory(c.category) === categoryHint);

    const matches: ParsedScheduleMatch[] = [];
    for (const f of pack.fixtures) {
      if (normalizeAthleteCategory(f.category) !== categoryHint) continue;
      const m = fixtureToMatch(f, pack.season, categoryHint, warnings);
      if (m) matches.push(m);
    }

    schedules.push({
      championshipTitle: comp?.name ?? `Campeonato Paulista ${categoryHint}`,
      seasonYear: pack.season,
      categoryHint,
      participants,
      matches,
      warnings,
    });
  }

  return schedules;
}
