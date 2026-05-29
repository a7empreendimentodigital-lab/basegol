import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { impersonationSchema } from "@/utils/zod-schemas";
import { fail, ok } from "@/utils/api-response";
import { AUDIT_ACTIONS } from "@/utils/audit-actions";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    return fail("Sem permissão", 403);
  }

  const parsed = impersonationSchema.safeParse(await req.json());
  if (!parsed.success) {
    return fail("Payload inválido", 400, parsed.error.flatten());
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.targetUserId },
    include: { role: true },
  });
  if (!target) {
    return fail("Usuário não encontrado", 404);
  }

  const store = await cookies();
  store.set("bg_impersonate", `${target.id}:${target.role.slug.toUpperCase()}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  store.set("bg_impersonate_role", target.role.slug.toUpperCase(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  await writeAuditLog({
    userId: session.user.id,
    action: AUDIT_ACTIONS.IMPERSONATION_STARTED,
    entity: "User",
    entityId: target.id,
    impersonatedUserId: target.id,
    metadata: {
      targetEmail: target.email,
      targetRole: target.role.slug.toUpperCase(),
    },
  });

  return ok({ impersonating: true, targetUserId: target.id });
}
