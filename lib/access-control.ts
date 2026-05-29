import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getSessionUserOrThrow() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { role: true, clubUsers: true },
  });
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export function hasRole(role: string | undefined, allowed: string[]) {
  return !!role && allowed.includes(role.toUpperCase());
}
