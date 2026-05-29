import { prisma } from "@/lib/prisma";

type AuditInput = {
  userId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  impersonatedUserId?: string;
  metadata?: unknown;
  ipAddress?: string;
};

export async function writeAuditLog(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        impersonatedUserId: input.impersonatedUserId,
        metadata: input.metadata as object | undefined,
        ipAddress: input.ipAddress,
      },
    });
  } catch {
    // no-op: audit should not break the request
  }
}
