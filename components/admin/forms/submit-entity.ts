import { parseApiResponse } from "@/lib/api-client";

export async function submitEntity<T>(entity: string, data: unknown, id?: string): Promise<T> {
  const url = id ? `/api/admin/crud/${entity}/${id}` : `/api/admin/crud/${entity}`;
  const res = await fetch(url, {
    method: id ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as {
      error?: string;
      details?: string | null;
    };
    const detail = typeof json.details === "string" ? json.details : null;
    throw new Error(detail || json.error || "Erro ao salvar");
  }
  return parseApiResponse<T>(res);
}
