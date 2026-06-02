import type { PaulistaGroupTeam } from "@/services/paulista-pack-import/paulista-pack.types";

const SKIP_LINE =
  /^(CAMPEONATO|CLUBES PARTICIPANTES|Departamento de Competições|\d{2}\/\d{2}\/\d{4}|--\s*\d+)/i;

const GROUP_FOOTER = /^GRUPO\s*0*(\d{1,2})\s*$/i;

/** Linhas de clube no PDF de participantes FPF (lista sequencial, 8 clubes por grupo). */
function isParticipantClubLine(line: string): boolean {
  if (!line || SKIP_LINE.test(line)) return false;
  if (GROUP_FOOTER.test(line)) return false;
  return line.length >= 12 && /[A-Za-zÀ-ú]/.test(line);
}

/**
 * Extrai inscrições por grupo do texto do PDF "Clubes Participantes".
 * Ordem: Grupo 01 (8 clubes), Grupo 02 (8), … Grupo 10 (8).
 */
export function parseParticipantsPdfText(
  text: string,
  categoryHint: "Sub-11" | "Sub-12" = "Sub-11"
): PaulistaGroupTeam[] {
  const clubLines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(isParticipantClubLine);

  const rows: PaulistaGroupTeam[] = [];
  const clubsPerGroup = 8;
  const totalGroups = 10;

  for (let i = 0; i < clubLines.length; i++) {
    const groupNum = Math.floor(i / clubsPerGroup) + 1;
    if (groupNum > totalGroups) break;
    const official_name = clubLines[i];
    const alias = official_name.split(/\s{2,}/)[0]?.trim() || official_name;
    rows.push({
      competition_category: categoryHint,
      group: groupNum,
      official_name,
      alias,
    });
  }

  return rows;
}
