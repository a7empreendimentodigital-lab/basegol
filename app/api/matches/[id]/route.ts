import { getMatchDetailForApi } from "@/services/match.service";
import { fail } from "@/utils/api-response";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const debug = new URL(request.url).searchParams.get("debug") === "1";
    const match = await getMatchDetailForApi(id);
    if (!match) {
      return fail("Partida não encontrada", 404);
    }

    const body = debug
      ? {
          ...match,
          _scoreAudit: match.scoreAudit,
        }
      : match;

    return NextResponse.json(
      { ok: true, data: body },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch {
    return fail("Não foi possível carregar a partida", 500);
  }
}
