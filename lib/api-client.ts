export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = { ok: false; error: string; details?: unknown };

export async function parseApiResponse<T>(res: Response): Promise<T> {
  const json = (await res.json().catch(() => ({}))) as ApiSuccess<T> | ApiFailure | T;

  if (json && typeof json === "object" && "ok" in json) {
    if (json.ok === false) {
      throw new Error(json.error || "Erro na requisição");
    }
    return json.data as T;
  }

  return json as T;
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as ApiFailure).error || `Erro ${res.status}`);
  }
  return parseApiResponse<T>(res);
}

export async function apiMutate<T>(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as ApiFailure).error || `Erro ${res.status}`);
  }
  return parseApiResponse<T>(res);
}
