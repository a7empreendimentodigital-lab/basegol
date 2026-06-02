import { readFileSync } from "node:fs";
import path from "node:path";
import { findExistingClub, pickCanonicalClubName } from "@/lib/club-lookup";
import { ensureUniqueClubSlug } from "@/lib/club-slug";
import { formatClubDisplayName, normalizeClubName } from "@/lib/normalize-name";
import { prisma } from "@/lib/prisma";
import { parseGroupTeamsCsv } from "@/services/paulista-pack-import/paulista-pack-loader";
import type { PaulistaGroupTeam } from "@/services/paulista-pack-import/paulista-pack.types";
import { resolveClubByOfficialName } from "@/services/group-roster-sync.service";

export const DEFAULT_FPF_CLUBS_CSV = path.join(process.cwd(), "data/fpf-2026/group_teams.csv");

/** Cidades padrão para clubes da lista FPF (quando ainda não cadastrados). */
const FPF_CLUB_CITIES: Record<string, string> = {
  "clube atletico linense": "Lins",
  "esporte clube xv de novembro": "Jaú",
  "esporte clube taubate": "Taubaté",
  "futebol clube primeira camisa": "São Paulo",
};

export type FpfClubsSyncResult = {
  officialTotal: number;
  beforeCount: number;
  afterCount: number;
  created: number;
  updated: number;
  stillMissing: string[];
  createdNames: string[];
  updatedNames: string[];
};

function loadOfficialRoster(csvPath = DEFAULT_FPF_CLUBS_CSV): PaulistaGroupTeam[] {
  return parseGroupTeamsCsv(readFileSync(csvPath));
}

function officialEntries(roster: PaulistaGroupTeam[]) {
  const map = new Map<string, string>();
  for (const row of roster) {
    if (!map.has(row.official_name)) {
      map.set(row.official_name, row.alias);
    }
  }
  return [...map.entries()].map(([official_name, alias]) => ({ official_name, alias }));
}

async function findClubByAlias(alias: string) {
  const norm = normalizeClubName(alias);
  if (!norm) return null;

  const clubs = await prisma.club.findMany({
    where: { shortName: { not: null } },
    select: { id: true, name: true, shortName: true },
  });

  for (const club of clubs) {
    const labels = [club.name, club.shortName].filter(Boolean) as string[];
    if (labels.some((label) => normalizeClubName(label) === norm)) {
      return club;
    }
  }

  return null;
}

async function findLooseClub(officialName: string, alias: string) {
  const byOfficial = await findExistingClub(officialName);
  if (byOfficial) return byOfficial;

  const byAlias = await findExistingClub(alias);
  if (byAlias) return byAlias;

  const byShort = await findClubByAlias(alias);
  if (byShort) return { id: byShort.id, name: byShort.name };

  return null;
}

function cityForOfficial(officialName: string): string | null {
  const key = normalizeClubName(officialName);
  return FPF_CLUB_CITIES[key] ?? null;
}

export async function syncFpfClubsFromCsv(
  csvPath = DEFAULT_FPF_CLUBS_CSV
): Promise<FpfClubsSyncResult> {
  const roster = loadOfficialRoster(csvPath);
  const entries = officialEntries(roster);
  const beforeCount = await prisma.club.count();

  const result: FpfClubsSyncResult = {
    officialTotal: entries.length,
    beforeCount,
    afterCount: beforeCount,
    created: 0,
    updated: 0,
    stillMissing: [],
    createdNames: [],
    updatedNames: [],
  };

  for (const { official_name, alias } of entries) {
    const displayName = formatClubDisplayName(official_name);
    const shortName = alias ? formatClubDisplayName(alias) : null;
    const city = cityForOfficial(official_name);

    let club = await findLooseClub(official_name, alias);
    if (!club) {
      club = await resolveClubByOfficialName(official_name);
    }

    if (club) {
      const current = await prisma.club.findUnique({
        where: { id: club.id },
        select: { id: true, name: true, shortName: true, city: true, normalizedName: true },
      });
      if (!current) continue;

      const canonical = pickCanonicalClubName(current.name, displayName);
      const needsUpdate =
        current.name !== canonical ||
        (shortName && current.shortName !== shortName) ||
        (city && !current.city);

      if (needsUpdate) {
        await prisma.club.update({
          where: { id: current.id },
          data: {
            name: canonical,
            normalizedName: normalizeClubName(canonical),
            shortName: shortName ?? current.shortName,
            city: current.city ?? city,
            status: "APPROVED",
          },
        });
        result.updated += 1;
        result.updatedNames.push(canonical);
      }
      continue;
    }

    const slug = await ensureUniqueClubSlug(displayName);
    await prisma.club.create({
      data: {
        name: displayName,
        normalizedName: normalizeClubName(displayName),
        shortName,
        slug,
        city,
        state: "SP",
        status: "APPROVED",
      },
    });
    result.created += 1;
    result.createdNames.push(displayName);
  }

  for (const { official_name } of entries) {
    const club = await resolveClubByOfficialName(official_name);
    if (!club) result.stillMissing.push(official_name);
  }

  result.afterCount = await prisma.club.count();
  return result;
}
