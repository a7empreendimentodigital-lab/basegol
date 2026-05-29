import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { systemSettingUpsertSchema } from "@/utils/zod-schemas";
import { fail, ok } from "@/utils/api-response";
import { AUDIT_ACTIONS } from "@/utils/audit-actions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !["SUPER_ADMIN", "ADMIN_LIGA"].includes(session.user.role)) {
    return fail("Sem permissão", 403);
  }

  const items = await prisma.systemSetting.findMany({
    orderBy: { key: "asc" },
  });
  return ok(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !["SUPER_ADMIN", "ADMIN_LIGA"].includes(session.user.role)) {
    return fail("Sem permissão", 403);
  }

  const parsed = systemSettingUpsertSchema.safeParse(await req.json());
  if (!parsed.success) {
    return fail("Payload inválido", 400, parsed.error.flatten());
  }

  const setting = await prisma.systemSetting.upsert({
    where: { key: parsed.data.key },
    update: { value: parsed.data.value as object, updatedBy: session.user.id },
    create: { key: parsed.data.key, value: parsed.data.value as object, updatedBy: session.user.id },
  });

  await writeAuditLog({
    userId: session.user.id,
    action: AUDIT_ACTIONS.SYSTEM_SETTING_UPDATED,
    entity: "SystemSetting",
    entityId: setting.id,
    metadata: { key: setting.key },
  });

  return ok(setting);
}
