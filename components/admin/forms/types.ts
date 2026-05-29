export type AdminFormProps = {
  initial?: Record<string, unknown> | null;
  onSuccess: () => void;
  onCancel: () => void;
};

export function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

export function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export function bool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}
