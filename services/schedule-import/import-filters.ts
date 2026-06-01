import { slugify } from "@/lib/utils";

export type ScheduleImportFilters = {
  /** Ex.: Sub-11, Sub-12 — comparado com categoryHint do PDF ou nome da categoria no banco */
  categoryHint?: string;
  roundNumber?: number;
  /** Ex.: Grupo 03 ou 3 */
  groupName?: string;
};

export function normalizeGroupFilterInput(input: string): string {
  const trimmed = input.trim();
  const num = trimmed.match(/^(\d{1,2})$/);
  if (num) return `Grupo ${num[1].padStart(2, "0")}`;
  if (/^grupo\s+\d/i.test(trimmed)) {
    const n = trimmed.match(/(\d{1,2})/);
    if (n) return `Grupo ${n[1].padStart(2, "0")}`;
  }
  return trimmed;
}

export function groupMatchesFilter(groupName: string, filter?: string): boolean {
  if (!filter?.trim()) return true;
  const normalized = normalizeGroupFilterInput(filter);
  return (
    groupName === normalized ||
    slugify(groupName) === slugify(normalized) ||
    groupName === filter.trim()
  );
}

export function categoryMatchesFilter(categoryHint: string, filter?: string): boolean {
  if (!filter?.trim()) return true;
  return slugify(categoryHint) === slugify(filter);
}

export const PAULISTA_CATEGORY_OPTIONS = [
  { value: "sub-11", label: "Sub-11" },
  { value: "sub-12", label: "Sub-12" },
] as const;
