import crypto from "crypto";
import { requestPasswordResetSchema } from "@/utils/zod-schemas";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { fail, ok } from "@/utils/api-response";
import { AUDIT_ACTIONS } from "@/utils/audit-actions";

export async function POST(req: Request) {
  const parsed = requestPasswordResetSchema.safeParse(await req.json());
  if (!parsed.success) {
    return fail("Payload inválido", 400, parsed.error.flatten());
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  // Always return success to prevent user enumeration.
  if (!user) {
    return ok({ requested: true });
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: AUDIT_ACTIONS.PASSWORD_RESET_REQUESTED,
    entity: "User",
    entityId: user.id,
  });

  // In produção, enviar por email. Em dev, retorna token.
  return ok({
    requested: true,
    resetToken: process.env.NODE_ENV === "development" ? rawToken : undefined,
  });
}
