import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";
import { revalidatePublicContent } from "@/lib/revalidate-public-content";
import { backfillMatchRoundsFromFpfPack } from "@/services/match-round-backfill.service";
import { fail, ok } from "@/utils/api-response";

export const maxDuration = 300;

async function ensureAdmin() {
  const user = await getSessionUserOrThrow();
  const role = user.role.slug.toUpperCase();
  if (!hasRole(role, ["SUPER_ADMIN", "ADMIN_LIGA"])) {
    throw new Error("FORBIDDEN");
  }
}

export async function POST(req: Request) {
  try {
    await ensureAdmin();
    const body = (await req.json().catch(() => ({}))) as {
      category?: string;
      categoryId?: string;
      dryRun?: boolean;
      championshipId?: string;
    };

    let categoryFilter = body.category ?? null;
    if (!categoryFilter && body.categoryId) {
      const cat = await prisma.category.findUnique({
        where: { id: body.categoryId },
        select: { name: true },
      });
      categoryFilter = cat?.name ?? null;
    }

    const result = await backfillMatchRoundsFromFpfPack({
      categoryFilter,
      dryRun: body.dryRun === true,
      championshipId: body.championshipId,
    });

    if (!body.dryRun) {
      revalidatePublicContent();
    }

    return ok(result);
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return fail("Sem permissão", 403);
    }
    return fail(e instanceof Error ? e.message : "Erro ao corrigir rodadas", 500);
  }
}
