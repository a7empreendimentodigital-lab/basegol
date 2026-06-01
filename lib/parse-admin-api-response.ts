/** Lê resposta da API admin; evita erro críptico quando o servidor devolve HTML. */
export async function parseAdminApiResponse(res: Response): Promise<{
  ok: boolean;
  data?: unknown;
  error?: string;
}> {
  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();

  if (!contentType.includes("application/json")) {
    if (res.status === 404) {
      return {
        ok: false,
        error:
          "Rota da API não encontrada (404). Confira se o deploy na Vercel já inclui a versão com “Importar pacote Paulista”.",
      };
    }
    if (res.status === 413) {
      return { ok: false, error: "Arquivo grande demais para o servidor (413). Use o script CLI." };
    }
    if (res.status === 504 || res.status === 502) {
      return {
        ok: false,
        error:
          "Tempo esgotado no servidor. Para ~1.000 jogos, use o script: npm run import:paulista-pack -- <pasta> <championshipId>",
      };
    }
    if (text.includes("<!DOCTYPE") || text.includes("<html")) {
      return {
        ok: false,
        error: `Resposta inválida do servidor (HTTP ${res.status}). Tente de novo ou use o script CLI.`,
      };
    }
    return { ok: false, error: text.slice(0, 200) || `Erro HTTP ${res.status}` };
  }

  try {
    return JSON.parse(text) as { ok: boolean; data?: unknown; error?: string };
  } catch {
    return { ok: false, error: "Resposta JSON inválida do servidor." };
  }
}
