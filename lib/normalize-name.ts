/**
 * Normalização para comparação e deduplicação (clubes, locais, etc.).
 * Remove acentos, pontuação, sufixos jurídicos comuns e espaços extras.
 */
const LEGAL_SUFFIXES =
  /\b(ltda|s\.?a\.?|s\/a|saf|me|epp|futebol clube|esporte clube|f\.?c\.?|e\.?c\.?|a\.?c\.?|a\.?a\.?|s\.?c\.?|gr\.?)\b/gi;

export function normalizeEntityName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(LEGAL_SUFFIXES, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Chave mais agressiva para clubes (abreviações da tabela FP). */
export function normalizeClubName(value: string): string {
  return normalizeEntityName(value)
    .replace(/\bfoot\s*ball\b/g, "football")
    .replace(/\bde\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const PT_PARTICLES = new Set([
  "de",
  "do",
  "da",
  "das",
  "dos",
  "e",
  "em",
  "no",
  "na",
  "nos",
  "nas",
  "ao",
  "aos",
]);

/** Siglas comuns em clubes brasileiros (permanecem em maiúsculas). */
const CLUB_ACRONYMS = new Set([
  "fc",
  "ec",
  "ac",
  "aa",
  "sc",
  "saf",
  "sp",
  "rj",
  "mg",
  "pr",
  "rs",
  "ce",
  "pe",
  "ba",
  "go",
  "df",
  "pa",
  "am",
  "rn",
  "pb",
  "al",
  "se",
  "mt",
  "ms",
  "ro",
  "rr",
  "ap",
  "to",
  "pi",
  "ma",
  "i9",
]);

export function isMostlyUppercase(value: string): boolean {
  const letters = value.replace(/[^A-Za-zÀ-ÿ]/g, "");
  if (letters.length < 4) return false;
  const upper = value.replace(/[^A-ZÁÉÍÓÚÂÊÔÃÇ]/g, "").length;
  return upper / letters.length >= 0.75;
}

function formatWord(word: string, index: number): string {
  if (!word) return word;
  const lower = word.toLowerCase();
  if (lower === "s/a" || lower === "s/a.") return "S/A";

  const bare = lower.replace(/\./g, "");
  if (index > 0 && PT_PARTICLES.has(bare)) return lower;
  if (CLUB_ACRONYMS.has(bare)) {
    return word.includes(".") ? `${bare.toUpperCase()}.` : bare.toUpperCase();
  }
  if (/^[a-z]{1,2}\.$/i.test(word)) return word.toUpperCase();
  if (bare === "ltda" || bare === "me" || bare === "epp") {
    const base = bare.charAt(0).toUpperCase() + bare.slice(1);
    return word.endsWith(".") ? `${base}.` : base;
  }

  const parts = word.split("-");
  if (parts.length > 1) {
    return parts
      .map((p, i) => formatWord(p, index > 0 || i > 0 ? 1 : 0))
      .join("-");
  }

  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** Exibe nome de clube em caixa normal (título), não em MAIÚSCULAS como no PDF da FPF. */
export function formatClubDisplayName(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return trimmed;
  if (!isMostlyUppercase(trimmed)) return trimmed;

  return trimmed
    .split(/\s+/)
    .map((word, index) => formatWord(word, index))
    .join(" ");
}

const GENERIC_CLUB_TOKENS = new Set([
  "futebol",
  "clube",
  "esporte",
  "soccer",
  "sports",
  "sport",
  "football",
  "ball",
  "de",
  "do",
  "da",
  "das",
  "dos",
  "ltda",
  "saf",
  "associacao",
  "atletico",
  "atletica",
  "gr",
  "ec",
  "fc",
  "ac",
  "aa",
  "sc",
  "internacional",
  "academy",
  "system",
  "club",
  "athletico",
]);

export function distinctiveClubTokens(value: string): string[] {
  return normalizeClubName(value)
    .split(" ")
    .filter((t) => t.length > 2 && !GENERIC_CLUB_TOKENS.has(t));
}

/** Evita falso positivo quando um token aparece no meio de outro (ex.: "linense" em "paulinense"). */
export function clubDistinctiveTokensAlign(a: string, b: string): boolean {
  if (a === b) return true;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  if (short.length < 4) return false;
  if (long.length - short.length > 2) return false;
  return (
    long.startsWith(short) ||
    long.endsWith(short) ||
    short.startsWith(long) ||
    short.endsWith(long)
  );
}

export function distinctiveClubOverlap(a: string, b: string): number {
  const ta = distinctiveClubTokens(a);
  const tb = distinctiveClubTokens(b);
  if (ta.length === 0 || tb.length === 0) return 0;
  let overlap = 0;
  for (const t of ta) {
    if (tb.some((u) => clubDistinctiveTokensAlign(t, u))) overlap++;
  }
  return overlap / Math.min(ta.length, tb.length);
}

export function isLikelySameClub(a: string, b: string): boolean {
  const na = normalizeClubName(a);
  const nb = normalizeClubName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;

  const da = distinctiveClubTokens(a);
  const db = distinctiveClubTokens(b);
  if (da.length === 0 || db.length === 0) return false;

  if (da.length === 1 && db.length === 1) {
    return da[0] === db[0] && da[0].length >= 5;
  }

  let overlap = 0;
  for (const t of da) {
    if (db.some((u) => u === t || (t.length >= 5 && u.length >= 5 && (u.startsWith(t) || t.startsWith(u))))) {
      overlap++;
    }
  }

  const minLen = Math.min(da.length, db.length);
  if (overlap >= 2 && overlap / minLen >= 0.85) return true;

  const short = da.length <= db.length ? da : db;
  const long = da.length > db.length ? da : db;
  const allShortInLong = short.every((t) =>
    long.some((u) => u === t || (t.length >= 5 && clubDistinctiveTokensAlign(t, u)))
  );
  if (allShortInLong && short.length >= 2) return true;
  if (allShortInLong && short.length === 1 && short[0].length >= 7) return true;

  return false;
}

export function namesMatch(a: string, b: string): boolean {
  return isLikelySameClub(a, b);
}
