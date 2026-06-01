/** Parse CSV/TSV com detecção simples de delimitador e cabeçalho. */
export type CsvRow = Record<string, string>;

function detectDelimiter(line: string): "," | ";" | "\t" {
  const counts = { ",": 0, ";": 0, "\t": 0 };
  for (const ch of line) {
    if (ch === "," || ch === ";" || ch === "\t") counts[ch]++;
  }
  if (counts[";"] >= counts[","] && counts[";"] >= counts["\t"]) return ";";
  if (counts["\t"] >= counts[","]) return "\t";
  return ",";
}

function splitLine(line: string, delimiter: "," | ";" | "\t"): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && ch === delimiter) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function parseCsvText(text: string): CsvRow[] {
  const raw = text.replace(/^\uFEFF/, "").trim();
  if (!raw) return [];

  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const delimiter = detectDelimiter(lines[0]);
  const headerCells = splitLine(lines[0], delimiter).map(normalizeHeader);
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i], delimiter);
    if (cells.every((c) => !c)) continue;
    const row: CsvRow = {};
    for (let j = 0; j < headerCells.length; j++) {
      row[headerCells[j]] = cells[j] ?? "";
    }
    rows.push(row);
  }

  return rows;
}

export function parseCsvBuffer(buffer: Buffer): CsvRow[] {
  return parseCsvText(buffer.toString("utf8"));
}

/** Primeiro valor não vazio entre aliases de coluna. */
export function pickColumn(row: CsvRow, ...keys: string[]): string {
  for (const key of keys) {
    const norm = normalizeHeader(key);
    const v = row[norm];
    if (v?.trim()) return v.trim();
  }
  return "";
}
