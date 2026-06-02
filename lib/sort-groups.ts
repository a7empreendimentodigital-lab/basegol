/** Ordena nomes do tipo "Grupo 01", "Grupo 2", "Grupo 10" numericamente. */
export function compareGroupNames(a: string, b: string): number {
  const numA = parseInt(a.match(/\d+/)?.[0] ?? "0", 10);
  const numB = parseInt(b.match(/\d+/)?.[0] ?? "0", 10);
  if (numA !== numB) return numA - numB;
  return a.localeCompare(b, "pt-BR");
}

export function sortByGroupName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => compareGroupNames(a.name, b.name));
}
