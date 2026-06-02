/** Parser do PDF "Tabela | Competições" da Federação Paulista (rodada com placar). */

export type ParsedFpfRoundMatch = {
  matchNumber: number;
  roundNumber: number;
  scheduledAt: Date;
  homeRaw: string;
  awayRaw: string;
  homeScore: number;
  awayScore: number;
  venueName: string;
  city: string;
};

const SKIP_LINE =
  /^(?:\d+\s+of\s+\d+|--\s*\d|a tabela abaixo|essas dados|02\/\d{2}\/\d{4}|https?:\/\/|tabela\s*\|)/i;

const ROUND_HEADER = /^Rodada\s+(\d{1,2})\b/i;
const DAY_HEADER =
  /^(?:Segunda|Terça|Quarta|Quinta|Sexta|Sábado|Domingo)\s*-/i;

const MATCH_LINE =
  /^Jogo\s+n[ºo°]?\s*(\d+)\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{1,2})h(\d{2})\s+(.+)$/i;

const LOCAL_LINE = /^Local:\s*(.*)$/i;
const CITY_LINE = /^Cidade:\s*(.*)$/i;
const TRANSMISSION_LINE = /^Transmissão:/i;

function parseScoresAndTeams(rest: string): {
  homeRaw: string;
  awayRaw: string;
  homeScore: number;
  awayScore: number;
} | null {
  const scoreMatch = rest.match(/\s+(\d+)\s+X\s+(\d+)\s+(.*)$/i);
  if (!scoreMatch) return null;
  const scorePos = rest.search(/\s+\d+\s+X\s+\d+\s+/i);
  if (scorePos < 0) return null;
  const homeRaw = rest.slice(0, scorePos).trim();
  const awayRaw = scoreMatch[3]
    .replace(/\s+Local:.*$/i, "")
    .replace(/\s+Cidade:.*$/i, "")
    .trim();
  return {
    homeRaw,
    awayRaw,
    homeScore: Number(scoreMatch[1]),
    awayScore: Number(scoreMatch[2]),
  };
}

function parseMatchDateTime(date: string, hour: string, minute: string): Date | null {
  const dm = date.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!dm) return null;
  const d = new Date(
    Number(dm[3]),
    Number(dm[2]) - 1,
    Number(dm[1]),
    Number(hour),
    Number(minute),
    0,
    0
  );
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Extrai jogos com placar do texto do PDF da FPF.
 * Suporta múltiplas rodadas no mesmo arquivo (usa o cabeçalho "Rodada N" mais recente).
 */
export function parseFpfRoundResultsPdfText(text: string): {
  roundNumbers: number[];
  matches: ParsedFpfRoundMatch[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const byNumber = new Map<number, ParsedFpfRoundMatch>();
  const roundNumbers = new Set<number>();

  let currentRound = 1;
  let pending: Omit<ParsedFpfRoundMatch, "venueName" | "city"> | null = null;
  let venueLines: string[] = [];
  let city = "";

  const flushVenue = () => {
    if (!pending) return;
    const venueName = venueLines.join(" ").replace(/\s+/g, " ").trim();
    byNumber.set(pending.matchNumber, {
      ...pending,
      venueName,
      city: city.trim(),
    });
    pending = null;
    venueLines = [];
    city = "";
  };

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\t+/g, " ").trim())
    .filter(Boolean);

  for (const line of lines) {
    if (SKIP_LINE.test(line) || DAY_HEADER.test(line)) continue;

    const roundM = line.match(ROUND_HEADER);
    if (roundM) {
      flushVenue();
      currentRound = Number(roundM[1]);
      roundNumbers.add(currentRound);
      continue;
    }

    const matchM = line.match(MATCH_LINE);
    if (matchM) {
      flushVenue();
      const teams = parseScoresAndTeams(matchM[5]);
      const scheduledAt = parseMatchDateTime(matchM[2], matchM[3], matchM[4]);
      if (!teams) {
        warnings.push(`Não foi possível ler placar do jogo nº ${matchM[1]}`);
        continue;
      }
      if (!scheduledAt) {
        warnings.push(`Data inválida no jogo nº ${matchM[1]}: ${matchM[2]}`);
        continue;
      }
      pending = {
        matchNumber: Number(matchM[1]),
        roundNumber: currentRound,
        scheduledAt,
        homeRaw: teams.homeRaw,
        awayRaw: teams.awayRaw,
        homeScore: teams.homeScore,
        awayScore: teams.awayScore,
      };
      const inlineLocal = matchM[5].match(/\s+Local:\s*(.+)$/i);
      if (inlineLocal) {
        venueLines = [inlineLocal[1].trim()];
      }
      continue;
    }

    if (!pending) continue;

    const localM = line.match(LOCAL_LINE);
    if (localM) {
      venueLines = [localM[1].trim()];
      continue;
    }

    const cityM = line.match(CITY_LINE);
    if (cityM) {
      city = cityM[1].trim();
      flushVenue();
      continue;
    }

    if (TRANSMISSION_LINE.test(line)) {
      flushVenue();
      continue;
    }

    if (venueLines.length > 0 && !CITY_LINE.test(line)) {
      venueLines.push(line);
    }
  }

  flushVenue();

  const matches = [...byNumber.values()].sort((a, b) => a.matchNumber - b.matchNumber);
  return {
    roundNumbers: [...roundNumbers].sort((a, b) => a - b),
    matches,
    warnings,
  };
}
