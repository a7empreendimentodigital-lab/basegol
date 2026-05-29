import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { fail, ok } from "@/utils/api-response";
import { AUDIT_ACTIONS } from "@/utils/audit-actions";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    return fail("Sem permissão", 403);
  }

  const store = await cookies();
  const current = store.get("bg_impersonate")?.value;
  const currentTarget = current?.split(":")[0];

  store.delete("bg_impersonate");
  store.delete("bg_impersonate_role");

  await writeAuditLog({
    userId: session.user.id,
    action: AUDIT_ACTIONS.IMPERSONATION_STOPPED,
    entity: "User",
    entityId: currentTarget,
    impersonatedUserId: currentTarget,
  });

  return ok({ impersonating: false });
}
