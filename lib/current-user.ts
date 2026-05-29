import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function getCurrentUserContext() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const authUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { role: true, clubUsers: true },
  });
  if (!authUser) return null;

  let effectiveUser = authUser;
  let isImpersonating = false;
  const adminImpersonationCookie = (await cookies()).get("bg_impersonate");

  if (authUser.role.slug.toUpperCase() === "SUPER_ADMIN" && adminImpersonationCookie?.value) {
    const [targetUserId] = adminImpersonationCookie.value.split(":");
    if (targetUserId) {
      const target = await prisma.user.findUnique({
        where: { id: targetUserId },
        include: { role: true, clubUsers: true },
      });
      if (target) {
        effectiveUser = target;
        isImpersonating = true;
      }
    }
  }

  return {
    authUser,
    effectiveUser,
    isImpersonating,
    role: effectiveUser.role.slug.toUpperCase(),
    authRole: authUser.role.slug.toUpperCase(),
  };
}
