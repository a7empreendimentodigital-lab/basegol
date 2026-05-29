import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { resetPasswordSchema } from "@/utils/zod-schemas";
import { fail, ok } from "@/utils/api-response";
import { AUDIT_ACTIONS } from "@/utils/audit-actions";

export async function POST(req: Request) {
  const parsed = resetPasswordSchema.safeParse(await req.json());
  if (!parsed.success) {
    return fail("Payload inválido", 400, parsed.error.flatten());
  }

  const tokenHash = crypto
    .createHash("sha256")
    .update(parsed.data.token)
    .digest("hex");

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return fail("Token inválido ou expirado", 400);
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash, mustChangePassword: false },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  await writeAuditLog({
    userId: resetToken.userId,
    action: AUDIT_ACTIONS.PASSWORD_RESET_COMPLETED,
    entity: "User",
    entityId: resetToken.userId,
  });

  return ok({ reset: true });
}
