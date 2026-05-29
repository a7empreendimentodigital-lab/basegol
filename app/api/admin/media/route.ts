import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/utils/api-response";
import { adminListQuerySchema } from "@/utils/zod-schemas";
import { prismaContains } from "@/lib/prisma-search";
import { normalizePagination } from "@/utils/pagination";

async function ensureAdmin() {
  const user = await getSessionUserOrThrow();
  const role = user.role.slug.toUpperCase();
  if (!hasRole(role, ["SUPER_ADMIN", "ADMIN_LIGA"])) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function GET(req: Request) {
  try {
    await ensureAdmin();
    const url = new URL(req.url);
    const parsed = adminListQuerySchema.parse({
      q: url.searchParams.get("q") ?? undefined,
      page: url.searchParams.get("page") ?? 1,
      pageSize: url.searchParams.get("pageSize") ?? 24,
    });
    const type = url.searchParams.get("type") ?? undefined;
    const category = url.searchParams.get("category") ?? undefined;
    const { skip, pageSize } = normalizePagination(parsed);

    const where = {
      ...(type ? { type: type as "IMAGE" | "DOCUMENT" | "VIDEO" } : {}),
      ...(category ? { category } : {}),
      ...(parsed.q
        ? {
            OR: [{ title: prismaContains(parsed.q) }, { originalName: prismaContains(parsed.q) }],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.mediaAsset.count({ where }),
    ]);

    return ok({ items, total });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return fail("Sem permissão", 403);
    return fail("Não autenticado", 401);
  }
}
