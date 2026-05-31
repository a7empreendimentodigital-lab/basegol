/** ID de relação vindo do registro (campo direto ou objeto aninhado da listagem). */
export function relationIdFromInitial(
  initial: Record<string, unknown> | null | undefined,
  field: string,
  nestedRelation?: string
): string {
  if (!initial) return "";
  const direct = initial[field];
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  if (nestedRelation) {
    const nested = initial[nestedRelation];
    if (nested && typeof nested === "object" && "id" in nested) {
      const id = (nested as { id?: unknown }).id;
      if (typeof id === "string" && id.trim()) return id.trim();
    }
  }
  return "";
}
