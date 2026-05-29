import { parseApiResponse } from "@/lib/api-client";

export async function submitClubEntity<T>(entity: string, data: unknown, id?: string): Promise<T> {
  const url = id ? `/api/club/crud/${entity}/${id}` : `/api/club/crud/${entity}`;
  const res = await fetch(url, {
    method: id ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as { error?: string }).error || "Erro ao salvar");
  }
  return parseApiResponse<T>(res);
}
