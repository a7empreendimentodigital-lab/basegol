import { prisma } from "@/lib/prisma";
import { normalizeEntityName } from "@/lib/normalize-name";

export type AthleteIdentity = {
  clubId: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  shirtNumber?: number | null;
};

function samePersonName(
  aFirst: string,
  aLast: string,
  bFirst: string,
  bLast: string
): boolean {
  return (
    normalizeEntityName(aFirst) === normalizeEntityName(bFirst) &&
    normalizeEntityName(aLast) === normalizeEntityName(bLast)
  );
}

/** Evita duplicar atleta no mesmo clube (nome + data de nascimento; opcionalmente número). */
export async function findExistingAthlete(input: AthleteIdentity) {
  const byBirth = await prisma.athlete.findMany({
    where: {
      clubId: input.clubId,
      birthDate: input.birthDate,
    },
  });

  const byName = byBirth.find((a) =>
    samePersonName(a.firstName, a.lastName, input.firstName, input.lastName)
  );
  if (byName) return byName;

  if (input.shirtNumber != null && Number.isFinite(input.shirtNumber)) {
    const byShirt = await prisma.athlete.findFirst({
      where: {
        clubId: input.clubId,
        shirtNumber: input.shirtNumber,
      },
    });
    if (
      byShirt &&
      samePersonName(byShirt.firstName, byShirt.lastName, input.firstName, input.lastName)
    ) {
      return byShirt;
    }
  }

  return null;
}
