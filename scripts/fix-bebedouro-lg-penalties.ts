/**
 * Corrige pênaltis Bebedouro x LG Futebol somente na categoria Sub-12 (5x6).
 * Restaura Sub-11 se tiver recebido a sequência 5x6 por engano.
 *
 * Uso: npx tsx scripts/fix-bebedouro-lg-penalties.ts
 */
import { rebuildScoresFromEvents } from "@/lib/match-live";
import {
  BEBEDOURO_LG_PENALTY_REFERENCE,
  buildPenaltyScoreFromAttempts,
  countConvertedAttempts,
  formatAttemptsSequence,
  parsePenaltyAttempts,
} from "@/lib/match-penalties";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SUB12_SLUG = "sub-12";
const SUB11_SLUG = "sub-11";

function isBebedouroLgClubs(homeClub: string, awayClub: string): boolean {
  const home = homeClub.toLowerCase();
  const away = awayClub.toLowerCase();
  const hasLg = home.includes("lg futebol") || away.includes("lg futebol");
  const hasBebedouro =
    home.includes("bebedouro") ||
    away.includes("bebedouro") ||
    home.includes("internacional") ||
    away.includes("internacional");
  return hasLg && hasBebedouro;
}

function hasWrongBebedouroReference(storedHome: unknown, storedAway: unknown): boolean {
  const home = parsePenaltyAttempts(storedHome).join("");
  const away = parsePenaltyAttempts(storedAway).join("");
  const refHome = BEBEDOURO_LG_PENALTY_REFERENCE.homeAttempts.join("");
  const refAway = BEBEDOURO_LG_PENALTY_REFERENCE.awayAttempts.join("");
  return home === refHome && away === refAway;
}

async function findBebedouroLgByCategory(categorySlug: string) {
  const matches = await prisma.match.findMany({
    where: {
      group: { category: { slug: categorySlug } },
    },
    include: {
      homeTeam: { include: { club: true } },
      awayTeam: { include: { club: true } },
      group: { include: { category: true } },
    },
  });

  return matches.find((m) =>
    isBebedouroLgClubs(m.homeTeam.club.name, m.awayTeam.club.name)
  );
}

async function loadScoreEvents(matchId: string) {
  return prisma.matchEvent.findMany({
    where: {
      matchId,
      type: { in: ["GOAL", "PENALTY_GOAL", "PENALTY_MISS", "KICKOFF"] },
    },
    orderBy: [{ minute: "asc" }, { createdAt: "asc" }],
    select: {
      type: true,
      teamId: true,
      description: true,
      minute: true,
      createdAt: true,
    },
  });
}

async function fixSub12() {
  const match = await findBebedouroLgByCategory(SUB12_SLUG);
  if (!match) {
    console.error(`Partida Bebedouro x LG não encontrada na categoria ${SUB12_SLUG}.`);
    process.exit(1);
  }

  const { homeAttempts, awayAttempts } = BEBEDOURO_LG_PENALTY_REFERENCE;
  const built = buildPenaltyScoreFromAttempts(homeAttempts, awayAttempts);

  console.log("\n=== Sub-12 (corrigir para 5x6) ===");
  console.log("id:", match.id);
  console.log("categoria:", match.group?.category?.name);
  console.log(match.homeTeam.club.name, "x", match.awayTeam.club.name);
  console.log(
    "Pênaltis:",
    formatAttemptsSequence(homeAttempts),
    "→",
    countConvertedAttempts(homeAttempts),
    "x",
    countConvertedAttempts(awayAttempts),
    "←",
    formatAttemptsSequence(awayAttempts)
  );

  await prisma.match.update({
    where: { id: match.id },
    data: {
      homeScore: 0,
      awayScore: 0,
      homePenaltyScore: built.homeScore,
      awayPenaltyScore: built.awayScore,
      homePenaltyAttempts: homeAttempts,
      awayPenaltyAttempts: awayAttempts,
      matchPeriod: "PENALTY_SHOOTOUT",
      currentPhase: "PENALTIES",
      hasPenaltyShootout: true,
      status: "FINISHED",
    },
  });

  console.log("OK — Sub-12: 0x0 (reg), pênaltis 5x6");
  return match.id;
}

async function restoreSub11IfNeeded() {
  const match = await findBebedouroLgByCategory(SUB11_SLUG);
  if (!match) {
    console.log("\n(Sub-11 Bebedouro x LG não encontrada — nada a restaurar)");
    return;
  }

  const events = await loadScoreEvents(match.id);
  const fromEventsOnly = rebuildScoresFromEvents(
    events,
    match.homeTeamId,
    match.awayTeamId
  );

  const wronglyPatched = hasWrongBebedouroReference(
    match.homePenaltyAttempts,
    match.awayPenaltyAttempts
  );

  const needsRestore =
    wronglyPatched ||
    (match.homePenaltyScore === 5 &&
      match.awayPenaltyScore === 6 &&
      events.length > 0 &&
      (fromEventsOnly.homePenaltyScore !== 5 ||
        fromEventsOnly.awayPenaltyScore !== 6));

  if (!wronglyPatched && !needsRestore) {
    console.log("\n=== Sub-11 ===");
    console.log("id:", match.id, "— sem alteração (não usa sequência Sub-12)");
    console.log(
      "Placar atual:",
      match.homeScore,
      "x",
      match.awayScore,
      "· Pen",
      match.homePenaltyScore,
      "x",
      match.awayPenaltyScore
    );
    return;
  }

  console.log("\n=== Sub-11 (restaurar valores dos eventos) ===");
  console.log("id:", match.id);
  console.log(
    "Antes:",
    match.homeScore,
    "x",
    match.awayScore,
    "· Pen",
    match.homePenaltyScore,
    "x",
    match.awayPenaltyScore
  );

  const hasPen =
    fromEventsOnly.homePenaltyScore + fromEventsOnly.awayPenaltyScore > 0 ||
    fromEventsOnly.homePenaltyAttempts.length > 0;

  await prisma.match.update({
    where: { id: match.id },
    data: {
      homeScore: fromEventsOnly.homeScore,
      awayScore: fromEventsOnly.awayScore,
      homePenaltyScore: fromEventsOnly.homePenaltyScore,
      awayPenaltyScore: fromEventsOnly.awayPenaltyScore,
      homePenaltyAttempts:
        fromEventsOnly.homePenaltyAttempts.length > 0
          ? fromEventsOnly.homePenaltyAttempts
          : Prisma.DbNull,
      awayPenaltyAttempts:
        fromEventsOnly.awayPenaltyAttempts.length > 0
          ? fromEventsOnly.awayPenaltyAttempts
          : Prisma.DbNull,
      hasPenaltyShootout: hasPen,
      ...(hasPen
        ? { matchPeriod: "PENALTY_SHOOTOUT", currentPhase: "PENALTIES" }
        : {
            matchPeriod: "FINISHED",
            currentPhase: "FINISHED",
          }),
    },
  });

  console.log(
    "Depois:",
    fromEventsOnly.homeScore,
    "x",
    fromEventsOnly.awayScore,
    "· Pen",
    fromEventsOnly.homePenaltyScore,
    "x",
    fromEventsOnly.awayPenaltyScore,
    fromEventsOnly.homePenaltyAttempts.length > 0
      ? `[${formatAttemptsSequence(fromEventsOnly.homePenaltyAttempts)} / ${formatAttemptsSequence(fromEventsOnly.awayPenaltyAttempts)}]`
      : "(sem pênaltis nos eventos)"
  );
  console.log("OK — Sub-11 restaurado a partir dos eventos (sem sequência 5x6 do Sub-12)");
}

async function main() {
  await restoreSub11IfNeeded();
  await fixSub12();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
