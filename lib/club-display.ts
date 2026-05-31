/** Sigla do cadastro do clube (campo shortName); fallback curto se vazia. */
export function clubSigla(shortName: string | null | undefined, fullName: string): string {
  const s = shortName?.trim();
  if (s) return s;
  const word = fullName.trim().split(/\s+/)[0];
  return word.length > 12 ? `${word.slice(0, 11)}…` : word;
}
