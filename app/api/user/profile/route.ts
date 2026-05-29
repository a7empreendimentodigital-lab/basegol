import { getSessionUserOrThrow } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/utils/api-response";
import { userProfileUpdateSchema } from "@/utils/zod-schemas/user-profile.schemas";

function serializeProfile(user: {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  phone: string | null;
  role: { name: string; slug: string };
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    phone: user.phone,
    roleName: user.role.name,
    roleSlug: user.role.slug,
  };
}

export async function GET() {
  try {
    const user = await getSessionUserOrThrow();
    return ok(serializeProfile(user));
  } catch {
    return fail("Não autenticado", 401);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getSessionUserOrThrow();
    const parsed = userProfileUpdateSchema.parse(await req.json());

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(parsed.name !== undefined ? { name: parsed.name } : {}),
        ...(parsed.phone !== undefined ? { phone: parsed.phone } : {}),
        ...(parsed.image !== undefined ? { image: parsed.image } : {}),
      },
      include: { role: true },
    });

    return ok(serializeProfile(updated));
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return fail("Não autenticado", 401);
    }
    return fail("Dados inválidos", 400);
  }
}
