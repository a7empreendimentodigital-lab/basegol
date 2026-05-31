/**
 * Corrige a disputa de pênaltis Bebedouro x LG Futebol (5x6).
 * Uso: npx tsx scripts/fix-bebedouro-lg-penalties.ts
 */
import {
  BEBEDOURO_LG_PENALTY_REFERENCE,
  buildPenaltyScoreFromAttempts,
  countConvertedAttempts,
  formatAttemptsSequence,
} from "@/lib/match-penalties";
import { rebuildScoresFromEvents } from "@/lib/match-live";
import { prisma } from "@/lib/prisma";

async function findTargetMatch() {
  const matches = await prisma.match.findMany({
    include: {
      homeTeam: { include: { club: true } },
      awayTeam: { include: { club: true } },
    },
  });

  return matches.find((m) => {
    const home = m.homeTeam.club.name.toLowerCase();
    const away = m.awayTeam.club.name.toLowerCase();
    const hasLg = away.includes("lg futebol") || home.includes("lg futebol");
    const hasBebedouro =
      home.includes("bebedouro") ||
      away.includes("bebedouro") ||
      home.includes("internacional") ||
      away.includes("internacional");
    return hasLg && hasBebedouro;
  });
}

async function main() {
  const match = await findTargetMatch();
  if (!match) {
    console.error("Partida Bebedouro/Internacional x LG não encontrada.");
    process.exit(1);
  }

  const { homeAttempts, awayAttempts } = BEBEDOURO_LG_PENALTY_REFERENCE;
  const built = buildPenaltyScoreFromAttempts(homeAttempts, awayAttempts);

  console.log("Partida:", match.id);
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

  const events = await prisma.matchEvent.findMany({
    where: { matchId: match.id },
    orderBy: [{ minute: "asc" }, { createdAt: "asc" }],
    select: { type: true, teamId: true, description: true, minute: true, createdAt: true },
  });

  const recalc = rebuildScoresFromEvents(events, match.homeTeamId, match.awayTeamId, {
    storedHomePenaltyAttempts: homeAttempts,
    storedAwayPenaltyAttempts: awayAttempts,
  });

  console.log("Recálculo após salvar:", recalc.homePenaltyScore, "x", recalc.awayPenaltyScore);
  console.log("OK — placar regulamentar 0x0, pênaltis 5x6");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
