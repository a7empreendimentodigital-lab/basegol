import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { firstAccessChangePasswordSchema } from "@/utils/zod-schemas";
import { fail, ok } from "@/utils/api-response";
import { AUDIT_ACTIONS } from "@/utils/audit-actions";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return fail("Não autenticado", 401);
  }

  const parsed = firstAccessChangePasswordSchema.safeParse(await req.json());
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Dados inválidos";
    return fail(msg, 400, parsed.error.flatten());
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user?.passwordHash) {
    return fail("Usuário inválido", 400);
  }

  const { newPassword, currentPassword } = parsed.data;

  if (user.mustChangePassword) {
    const sameAsTemp = await bcrypt.compare(newPassword, user.passwordHash);
    if (sameAsTemp) {
      return fail("Escolha uma senha diferente da senha temporária", 400);
    }
  } else {
    if (!currentPassword?.trim()) {
      return fail("Informe a senha atual", 400);
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return fail("Senha atual incorreta", 400);
    }
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: false },
  });

  await writeAuditLog({
    userId: user.id,
    action: AUDIT_ACTIONS.FIRST_ACCESS_PASSWORD_CHANGED,
    entity: "User",
    entityId: user.id,
  });

  return ok({ changed: true });
}
