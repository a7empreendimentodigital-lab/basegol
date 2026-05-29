import type { User } from "@prisma/client";

type UserWithClubs = User & {
  role: { slug: string };
  clubUsers: { clubId: string }[];
};

export function getUserRole(user: UserWithClubs) {
  return user.role.slug.toUpperCase();
}

export function resolveClubId(user: UserWithClubs, requestedClubId?: string | null): string {
  const role = getUserRole(user);
  if (role === "CLUBE") {
    const clubId = user.clubUsers[0]?.clubId;
    if (!clubId) throw new Error("NO_CLUB");
    return clubId;
  }
  if (requestedClubId) return requestedClubId;
  const fallback = user.clubUsers[0]?.clubId;
  if (!fallback) throw new Error("NO_CLUB");
  return fallback;
}
