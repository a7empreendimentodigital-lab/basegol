import {
  distinctiveClubTokens,
  formatClubDisplayName,
  normalizeClubName,
  namesMatch,
} from "@/lib/normalize-name";
import { buildClubAliasKeys } from "@/lib/match-import-fingerprint";
import { slugify } from "@/lib/utils";

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

const SKIP_LINE =
  /^(?:\d+\s+of\s+\d+|--\s*\d|departamento de competições|jg\s+rodada|horário|mandante|placar|visitante|local|tv|clubes participantes|obs\s*:)/i;

const MATCH_LINE =
  /^(\d{1,3})\s+(\d{1,2})\/(\w{3})\s*-\s*\S+\s+(\d{1,2})\s*h\s*(\d{1,2})\s+(.+)$/i;

const CHAMPIONSHIP_LINE = /campeonato\s+paulista/i;
const CATEGORY_SUB_LINE = /\bsub[-\s]?(\d{1,2})\b/i;
const PHASE_LINE = /^fase\s+(.+)$/i;
const TURN_LINE = /^(primeiro|segundo)\s+turno$/i;
const ROUND_HEADER = /^jg\s+rodada\s+(\d{1,2})\b/i;
const GROUP_LINE = /^grupo\s+(\d{1,2})$/i;
const PAGE_NOISE = /^--\s*\d+\s+of\s+\d+\s*--$/i;

export type ParsedParticipantClub = {
  fullName: string;
  city?: string;
  groupName: string;
  aliases: string[];
};

export type ParsedScheduleMatch = {
  matchNumber: number;
  roundNumber: number;
  phaseName: string;
  phaseSlug: string;
  turnName: string;
  turnSlug: string;
  homeRaw: string;
  awayRaw: string;
  venueName: string;
  scheduledAt: Date;
};

export type ParsedFpSchedule = {
  championshipTitle: string;
  seasonYear: number;
  categoryHint: string;
  participants: ParsedParticipantClub[];
  matches: ParsedScheduleMatch[];
  warnings: string[];
};

function parsePhaseSlug(name: string): string {
  const n = name.trim().toLowerCase();
  if (/semifinal/i.test(n)) return "fase-semifinal";
  if (/^final$/i.test(n.trim())) return "fase-final";
  const num = n.match(/(\d+)/);
  if (num) return `fase-${num[1].padStart(2, "0")}`;
  return slugify(name);
}

function parseTurnSlug(name: string): string {
  if (/segundo/i.test(name)) return "segundo-turno";
  if (/primeiro/i.test(name)) return "primeiro-turno";
  return slugify(name) || "unico";
}

/** Sufixo típico do nome do clube (não confundir "ESPORTE" no meio do nome). */
const CLUB_LINE_END =
  /\b(?:LTDA\.?|S\.?A\.?F\.?|S\/A|FUTEBOL\s+CLUBE|ESPORTE\s+CLUBE|ATHLETICO\s+CLUB|FOOT\s*BALL(?:\s+LTDA\.?)?|FUTEBOL\s+S\.?A\.?|ACADEMY|ACADEMIA|SPORTS)\s*$/i;

function splitClubLine(line: string): { name: string; city?: string } {
  const trimmed = line.trim().replace(/\s+-\s+/, " - ");
  const dashSplit = trimmed.split(/\s+-\s+/);
  if (dashSplit.length === 2 && dashSplit[1].trim().length >= 3) {
    return {
      name: formatClubDisplayName(dashSplit[0].trim()),
      city: formatClubDisplayName(dashSplit[1].trim()),
    };
  }

  const parts = trimmed.split(/\s{2,}|\t/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return {
      name: formatClubDisplayName(parts.slice(0, -1).join(" ")),
      city: formatClubDisplayName(parts[parts.length - 1]),
    };
  }

  const tokens = trimmed.split(/\s+/);
  if (tokens.length <= 2) {
    return { name: formatClubDisplayName(trimmed) };
  }

  for (let cityWords = 1; cityWords <= Math.min(6, tokens.length - 2); cityWords++) {
    const name = tokens.slice(0, -cityWords).join(" ");
    const city = tokens.slice(-cityWords).join(" ");
    if (CLUB_LINE_END.test(name)) {
      return { name: formatClubDisplayName(name), city: formatClubDisplayName(city) };
    }
  }

  const last = tokens[tokens.length - 1];
  if (last.length >= 3 && /^[A-ZÁÉÍÓÚÂÊÔÃÇ]/.test(last)) {
    return {
      name: formatClubDisplayName(tokens.slice(0, -1).join(" ")),
      city: formatClubDisplayName(last),
    };
  }
  return { name: formatClubDisplayName(trimmed) };
}

function isParticipantClubLine(line: string): boolean {
  if (!line || line.length < 8) return false;
  if (SKIP_LINE.test(line) || PAGE_NOISE.test(line)) return false;
  if (CHAMPIONSHIP_LINE.test(line)) return false;
  if (GROUP_LINE.test(line)) return false;
  if (MATCH_LINE.test(line)) return false;
  if (PHASE_LINE.test(line)) return false;
  if (TURN_LINE.test(line)) return false;
  if (ROUND_HEADER.test(line)) return false;
  if (/^\d{1,2}\/\d{2}\/\d{4}/.test(line)) return false;
  if (/^\d+\s+of\s+\d+/i.test(line)) return false;
  return /^[A-ZÁÉÍÓÚÂÊÔÃÇ0-9]/.test(line);
}

function parseMatchDate(day: number, mon: string, hour: number, minute: number, year: number): Date | null {
  const m = MONTHS[mon.toLowerCase().slice(0, 3)];
  if (m === undefined) return null;
  return new Date(year, m, day, hour, minute, 0, 0);
}

const TEAM_MARKERS =
  /\b(f\.?c\.?|e\.?c\.?|a\.?c\.?|a\.?a\.?|s\.?a\.?f\.?|s\/a|clube|futebol|foot\s*ball|soccer|sports)\b/i;

function looksLikeTeamName(value: string): boolean {
  const t = value.trim();
  if (!t) return false;
  if (TEAM_MARKERS.test(t)) return true;
  const tokens = t.split(/\s+/);
  if (tokens.length < 2 && t.length < 10) return false;
  const letters = t.replace(/[^A-Za-zÀ-ÿ]/g, "");
  if (!letters) return false;
  const upper = letters.replace(/[^A-ZÁÉÍÓÚÂÊÔÃÇ]/g, "").length;
  return upper / letters.length >= 0.75;
}

function extractTeamsAndVenue(rest: string): { home: string; away: string; venue: string } | null {
  const xIdx = rest.search(/\s+X\s+/i);
  if (xIdx < 0) return null;
  const home = rest.slice(0, xIdx).trim();
  const after = rest.slice(xIdx).replace(/^\s+X\s+/i, "").trim();
  const venueTokens = after.split(/\s+/);
  if (venueTokens.length === 1) {
    return { home, away: after, venue: after };
  }
  for (let i = 1; i < venueTokens.length; i++) {
    const awayCandidate = venueTokens.slice(0, i).join(" ");
    const venueCandidate = venueTokens.slice(i).join(" ");
    if (looksLikeTeamName(awayCandidate) && !looksLikeTeamName(venueCandidate)) {
      return { home, away: awayCandidate, venue: venueCandidate };
    }
  }
  if (venueTokens.length === 2) {
    return { home, away: venueTokens[0], venue: venueTokens[1] };
  }
  const away = venueTokens.slice(0, -1).join(" ");
  const venue = venueTokens[venueTokens.length - 1];
  return { home, away, venue };
}

type CategorySegmentMeta = {
  start: number;
  categoryHint: string;
  championshipTitle: string;
  seasonYear: number;
};

function extractCategoryFromLine(line: string): { categoryHint: string; seasonYear: number } | null {
  const sub = line.match(CATEGORY_SUB_LINE);
  if (!sub) return null;
  const y = line.match(/(20\d{2})/);
  return {
    categoryHint: `Sub-${sub[1]}`,
    seasonYear: y ? Number(y[1]) : new Date().getFullYear(),
  };
}

function isCategorySectionHeader(line: string): boolean {
  if (!CATEGORY_SUB_LINE.test(line)) return false;
  if (CHAMPIONSHIP_LINE.test(line)) return true;
  if (/^sub[-\s]?\d{1,2}\b/i.test(line)) return true;
  if (/categoria/i.test(line) && CATEGORY_SUB_LINE.test(line)) return true;
  return false;
}

/** Divide o PDF em blocos por categoria (Sub-11, Sub-12, …). */
export function findCategorySegments(lines: string[]): CategorySegmentMeta[] {
  const headers: { index: number; categoryHint: string; championshipTitle: string; seasonYear: number }[] =
    [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!isCategorySectionHeader(line)) continue;
    const cat = extractCategoryFromLine(line);
    if (!cat) continue;
    headers.push({
      index: i,
      categoryHint: cat.categoryHint,
      championshipTitle: CHAMPIONSHIP_LINE.test(line) ? line : `Campeonato Paulista ${cat.categoryHint}`,
      seasonYear: cat.seasonYear,
    });
  }

  const deduped = headers.filter((h, idx, arr) => idx === 0 || h.categoryHint !== arr[idx - 1].categoryHint);

  if (deduped.length === 0) {
    return [
      {
        start: 0,
        categoryHint: "Geral",
        championshipTitle: "Campeonato Paulista",
        seasonYear: new Date().getFullYear(),
      },
    ];
  }

  return deduped.map((h, idx) => ({
    start: idx === 0 ? 0 : h.index,
    categoryHint: h.categoryHint,
    championshipTitle: h.championshipTitle,
    seasonYear: h.seasonYear,
  }));
}

/** Retorna uma ou mais categorias encontradas no PDF. */
export function parseFpPaulistaSchedules(text: string): ParsedFpSchedule[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const segments = findCategorySegments(lines);
  const schedules: ParsedFpSchedule[] = [];

  for (let s = 0; s < segments.length; s++) {
    const meta = segments[s];
    const end = segments[s + 1]?.start ?? lines.length;
    schedules.push(parseFpPaulistaScheduleLines(lines.slice(meta.start, end), meta));
  }

  return schedules;
}

/** Compat: primeira categoria do PDF. */
export function parseFpPaulistaScheduleText(text: string): ParsedFpSchedule {
  const all = parseFpPaulistaSchedules(text);
  return all[0] ?? parseFpPaulistaScheduleLines([], {
    start: 0,
    categoryHint: "Geral",
    championshipTitle: "Campeonato Paulista",
    seasonYear: new Date().getFullYear(),
  });
}

function parseFpPaulistaScheduleLines(
  lines: string[],
  meta: CategorySegmentMeta
): ParsedFpSchedule {
  const warnings: string[] = [];
  const championshipTitle = meta.championshipTitle;
  const seasonYear = meta.seasonYear;
  const categoryHint = meta.categoryHint;

  const firstRoundIdx = lines.findIndex((l) => ROUND_HEADER.test(l));
  const participantLines: string[] = [];
  const participantEnd = firstRoundIdx >= 0 ? firstRoundIdx : lines.length;
  for (let i = 0; i < participantEnd; i++) {
    const line = lines[i];
    if (isParticipantClubLine(line)) {
      participantLines.push(line);
    }
  }

  const clubsPerGroup = 8;
  const participants: ParsedParticipantClub[] = [];
  participantLines.forEach((line, index) => {
    const groupNum = Math.floor(index / clubsPerGroup) + 1;
    const groupName = `Grupo ${String(groupNum).padStart(2, "0")}`;
    const { name, city } = splitClubLine(line);
    participants.push({
      fullName: name,
      city,
      groupName,
      aliases: buildClubAliasKeys(name),
    });
  });

  if (participants.length === 0) {
    warnings.push("Nenhum clube participante identificado; grupos serão inferidos pelos mandantes.");
  }

  let phaseName = "FASE 01";
  let phaseSlug = "fase-01";
  let turnName = "PRIMEIRO TURNO";
  let turnSlug = "primeiro-turno";
  let roundNumber = 1;

  const matches: ParsedScheduleMatch[] = [];

  for (const line of lines) {
    if (PAGE_NOISE.test(line) || SKIP_LINE.test(line)) continue;

    const phaseM = line.match(PHASE_LINE);
    if (phaseM) {
      phaseName = `FASE ${phaseM[1].trim()}`.replace(/\s+/g, " ");
      if (/semifinal/i.test(phaseM[1])) phaseName = "FASE SEMIFINAL";
      if (/^final$/i.test(phaseM[1].trim())) phaseName = "FASE FINAL";
      phaseSlug = parsePhaseSlug(phaseM[1]);
      continue;
    }

    const turnM = line.match(TURN_LINE);
    if (turnM) {
      turnName = line.toUpperCase();
      turnSlug = parseTurnSlug(line);
      continue;
    }

    const roundM = line.match(ROUND_HEADER);
    if (roundM) {
      roundNumber = Number(roundM[1]);
      continue;
    }

    const matchM = line.match(MATCH_LINE);
    if (matchM) {
      const [, num, day, mon, hour, minute, rest] = matchM;
      const teams = extractTeamsAndVenue(rest);
      if (!teams) {
        warnings.push(`Linha de jogo inválida: ${line}`);
        continue;
      }
      const scheduledAt = parseMatchDate(
        Number(day),
        mon,
        Number(hour),
        Number(minute),
        seasonYear
      );
      if (!scheduledAt) {
        warnings.push(`Data inválida na linha: ${line}`);
        continue;
      }
      matches.push({
        matchNumber: Number(num),
        roundNumber,
        phaseName,
        phaseSlug,
        turnName,
        turnSlug,
        homeRaw: teams.home,
        awayRaw: teams.away,
        venueName: teams.venue,
        scheduledAt,
      });
    }
  }

  if (participants.length > 0 && matches.length === 0) {
    warnings.push(
      `PDF só com clubes participantes (${participants.length}); nenhum jogo será importado. Cadastre os jogos manualmente depois.`
    );
  }

  return {
    championshipTitle,
    seasonYear,
    categoryHint,
    participants,
    matches,
    warnings,
  };
}

export function listDetectedCategories(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return [...new Set(findCategorySegments(lines).map((s) => s.categoryHint))];
}

export class ClubNameResolver {
  private readonly byKey = new Map<string, string>();
  private readonly entries: { fullName: string; keys: string[] }[] = [];

  constructor(participants: ParsedParticipantClub[]) {
    for (const p of participants) {
      this.entries.push({ fullName: p.fullName, keys: p.aliases });
      for (const k of p.aliases) {
        this.byKey.set(k, p.fullName);
      }
      this.byKey.set(normalizeClubName(p.fullName), p.fullName);
    }
  }

  resolve(raw: string): string {
    const key = normalizeClubName(raw);
    if (this.byKey.has(key)) return this.byKey.get(key)!;

    for (const entry of this.entries) {
      if (namesMatch(raw, entry.fullName)) return entry.fullName;
    }

    const rawTokens = distinctiveClubTokens(raw);
    if (rawTokens.length > 0) {
      let best: { fullName: string; score: number } | null = null;
      for (const entry of this.entries) {
        const fullTokens = distinctiveClubTokens(entry.fullName);
        let overlap = 0;
        for (const t of rawTokens) {
          if (fullTokens.some((u) => u === t || (t.length >= 4 && (u.includes(t) || t.includes(u))))) {
            overlap++;
          }
        }
        const score = overlap / rawTokens.length;
        if (score >= 0.75 && overlap >= 1) {
          if (!best || score > best.score || entry.fullName.length > best.fullName.length) {
            best = { fullName: entry.fullName, score };
          }
        }
      }
      if (best) return best.fullName;
    }

    for (const entry of this.entries) {
      if (entry.keys.some((k) => key.includes(k) || k.includes(key))) {
        return entry.fullName;
      }
    }

    return raw.trim();
  }
}

export function groupForClubs(
  resolver: ClubNameResolver,
  participants: ParsedParticipantClub[],
  homeRaw: string,
  awayRaw: string
): string {
  const home = resolver.resolve(homeRaw);
  const away = resolver.resolve(awayRaw);
  const homeP = participants.find((p) => namesMatch(p.fullName, home));
  const awayP = participants.find((p) => namesMatch(p.fullName, away));
  if (homeP && awayP && homeP.groupName === awayP.groupName) return homeP.groupName;
  if (homeP) return homeP.groupName;
  if (awayP) return awayP.groupName;
  return "Grupo Geral";
}
