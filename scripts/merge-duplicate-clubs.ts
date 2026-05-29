/**
 * Unifica clubes duplicados (nome completo vs abreviação da tabela de jogos).
 * Uso: npx tsx scripts/merge-duplicate-clubs.ts [--dry-run]
 */
import { readFileSync, existsSync } from "fs";
import { PrismaClient } from "@prisma/client";
import { pickCanonicalClubName } from "../lib/club-lookup";
import {
  distinctiveClubOverlap,
  formatClubDisplayName,
  isLikelySameClub,
  normalizeClubName,
} from "../lib/normalize-name";
import {
  ClubNameResolver,
  parseFpPaulistaSchedules,
} from "../services/schedule-import/fp-paulista-parser";
import { extractTextFromPdf } from "../services/schedule-import/pdf-text";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

const PDF_PATHS = [
  "/Users/crislainemarinho/Downloads/brasao/Sub-11.pdf",
  "/Users/crislainemarinho/Downloads/brasao/sub-12.pdf",
];

function clubQuality(c: {
  name: string;
  _count: { teams: number; athletes: number; homeMatches: number; awayMatches: number };
}): number {
  const tokens = c.name.trim().split(/\s+/);
  const last = tokens[tokens.length - 1] ?? "";
  const body = normalizeClubName(tokens.slice(0, -1).join(" "));
  const citySuffix = last.length <= 12 && body.includes(normalizeClubName(last));

  let score =
    c._count.teams * 10 +
    c._count.athletes * 5 +
    (c._count.homeMatches + c._count.awayMatches) * 2 +
    c.name.length;
  if (/^(EC|FC|AA|Red Bull|Sport Clube)$/i.test(c.name.trim())) score -= 500;
  if (citySuffix) score -= 100;
  return score;
}

async function loadResolver() {
  const participants = [];
  for (const path of PDF_PATHS) {
    if (!existsSync(path)) continue;
    const text = await extractTextFromPdf(readFileSync(path));
    for (const sched of parseFpPaulistaSchedules(text)) {
      participants.push(...sched.participants);
    }
  }
  return new ClubNameResolver(participants);
}

async function mergeClubInto(keepId: string, removeId: string) {
  const dupeTeams = await prisma.team.findMany({ where: { clubId: removeId } });

  for (const dt of dupeTeams) {
    const keepTeam = await prisma.team.findUnique({
      where: { clubId_groupId: { clubId: keepId, groupId: dt.groupId } },
    });

    if (keepTeam) {
      await prisma.match.updateMany({
        where: { homeTeamId: dt.id },
        data: { homeTeamId: keepTeam.id, homeClubId: keepId },
      });
      await prisma.match.updateMany({
        where: { awayTeamId: dt.id },
        data: { awayTeamId: keepTeam.id, awayClubId: keepId },
      });
      await prisma.lineup.updateMany({ where: { teamId: dt.id }, data: { teamId: keepTeam.id } });
      await prisma.standingRow.updateMany({ where: { teamId: dt.id }, data: { teamId: keepTeam.id } });
      if (!dryRun) await prisma.team.delete({ where: { id: dt.id } });
    } else if (!dryRun) {
      await prisma.team.update({ where: { id: dt.id }, data: { clubId: keepId } });
    }
  }

  if (!dryRun) {
    await prisma.match.updateMany({ where: { homeClubId: removeId }, data: { homeClubId: keepId } });
    await prisma.match.updateMany({ where: { awayClubId: removeId }, data: { awayClubId: keepId } });
    await prisma.athlete.updateMany({ where: { clubId: removeId }, data: { clubId: keepId } });
    await prisma.clubUser.updateMany({ where: { clubId: removeId }, data: { clubId: keepId } });
    await prisma.document.updateMany({ where: { clubId: removeId }, data: { clubId: keepId } });
    await prisma.registration.updateMany({ where: { clubId: removeId }, data: { clubId: keepId } });
    await prisma.staffMember.updateMany({ where: { clubId: removeId }, data: { clubId: keepId } });
    await prisma.club.delete({ where: { id: removeId } });
  }
}

async function main() {
  const resolver = await loadResolver();
  const clubs = await prisma.club.findMany({
    include: {
      _count: {
        select: { teams: true, athletes: true, homeMatches: true, awayMatches: true },
      },
    },
  });

  const parent = new Map<string, string>();
  const find = (id: string): string => {
    const p = parent.get(id) ?? id;
    if (p !== id) {
      const r = find(p);
      parent.set(id, r);
      return r;
    }
    return id;
  };
  const union = (a: string, b: string) => {
    unionIds(find(a), find(b));
  };
  const unionIds = (ra: string, rb: string) => {
    if (ra !== rb) parent.set(rb, ra);
  };

  function shouldMerge(a: (typeof clubs)[0], b: (typeof clubs)[0]): boolean {
    const na = normalizeClubName(a.name);
    const nb = normalizeClubName(b.name);
    if (na === nb) return true;

    const short = na.length < nb.length ? na : nb;
    const long = na.length >= nb.length ? na : nb;
    if (short.length >= 14 && long.startsWith(short)) return true;

    const ra = normalizeClubName(resolver.resolve(a.name));
    const rb = normalizeClubName(resolver.resolve(b.name));
    if (
      ra === rb &&
      ra.length >= 12 &&
      isLikelySameClub(a.name, b.name) &&
      distinctiveClubOverlap(a.name, b.name) >= 0.85
    ) {
      return true;
    }

    return false;
  }

  for (let i = 0; i < clubs.length; i++) {
    for (let j = i + 1; j < clubs.length; j++) {
      if (shouldMerge(clubs[i], clubs[j])) union(clubs[i].id, clubs[j].id);
    }
  }

  const groups = new Map<string, typeof clubs>();
  for (const c of clubs) {
    const root = find(c.id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(c);
  }

  let merged = 0;
  for (const group of groups.values()) {
    if (group.length < 2) continue;

    const sorted = [...group].sort((a, b) => clubQuality(b) - clubQuality(a));
    const keeper = sorted[0];
    const canonical = formatClubDisplayName(
      group.reduce((best, c) => pickCanonicalClubName(best, c.name), keeper.name)
    );

    for (const dupe of sorted.slice(1)) {
      console.log(`${dryRun ? "[dry-run] " : ""}"${dupe.name}" → "${canonical}"`);
      if (!dryRun) {
        await mergeClubInto(keeper.id, dupe.id);
        await prisma.club.update({
          where: { id: keeper.id },
          data: {
            name: canonical,
            normalizedName: normalizeClubName(canonical),
          },
        });
      }
      merged++;
    }
  }

  console.log(`\n${merged} duplicatas ${dryRun ? "detectadas" : "mescladas"}.`);
  if (!dryRun) console.log(`Clubes no banco: ${await prisma.club.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
