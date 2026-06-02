import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

/** Gera slug único para clube (criação ou troca explícita de slug). */
export async function ensureUniqueClubSlug(
  base: string,
  excludeClubId?: string
): Promise<string> {
  let slug = slugify(base);
  if (!slug) slug = `clube-${Date.now().toString(36).slice(-6)}`;

  let candidate = slug;
  let suffix = 2;
  while (true) {
    const existing = await prisma.club.findFirst({
      where: {
        slug: candidate,
        ...(excludeClubId ? { NOT: { id: excludeClubId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${slug}-${suffix}`;
    suffix += 1;
  }
}
