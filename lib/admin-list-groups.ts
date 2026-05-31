export type ListGroup<T> = {
  key: string;
  label: string;
  items: T[];
};

export function groupItemsByKey<T extends { id: string }>(
  items: T[],
  getKey: (item: T) => string,
  options?: {
    getLabel?: (key: string) => string;
    sortKeys?: (keys: string[]) => string[];
    sortItems?: (a: T, b: T) => number;
  }
): ListGroup<T>[] {
  const buckets = new Map<string, T[]>();

  for (const item of items) {
    const key = getKey(item).trim() || "Outros";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(item);
  }

  const sortItems =
    options?.sortItems ??
    ((a, b) => String((a as { name?: string }).name ?? a.id).localeCompare(String((b as { name?: string }).name ?? b.id), "pt-BR"));

  for (const list of buckets.values()) {
    list.sort(sortItems);
  }

  const keys = options?.sortKeys
    ? options.sortKeys([...buckets.keys()])
    : [...buckets.keys()].sort((a, b) => a.localeCompare(b, "pt-BR"));

  const getLabel = options?.getLabel ?? ((k) => k);

  return keys.map((key) => ({
    key,
    label: getLabel(key),
    items: buckets.get(key)!,
  }));
}

/** Ordem preferida para chaves de status (ex.: ACTIVE antes de DRAFT). */
export function sortKeysByOrder(keys: string[], order: string[]): string[] {
  const rank = new Map(order.map((k, i) => [k, i]));
  return [...keys].sort((a, b) => {
    const ra = rank.get(a) ?? 999;
    const rb = rank.get(b) ?? 999;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b, "pt-BR");
  });
}
