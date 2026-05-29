import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/utils/api-response";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !["SUPER_ADMIN", "ADMIN_LIGA"].includes(session.user.role)) {
    return fail("Sem permissão", 403);
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: true },
  });

  return ok(
    logs.map((l) => ({
      id: l.id,
      action: l.action,
      user: l.user?.email,
      entity: l.entity,
      entityId: l.entityId,
      impersonatedUserId: l.impersonatedUserId,
      createdAt: l.createdAt,
    }))
  );
}
