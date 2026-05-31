/**
 * Recalcula placar regulamentar e pênaltis de todas as partidas a partir dos eventos.
 * Uso: npx tsx scripts/reconcile-match-penalties.ts
 */
import { rebuildScoresFromEvents } from "@/lib/match-live";
import {
  BEBEDOURO_LG_PENALTY_REFERENCE,
  buildPenaltyScoreFromAttempts,
  formatAttemptsSequence,
} from "@/lib/match-penalties";
import { prisma } from "@/lib/prisma";

function isBebedouroLgMatch(homeClub: string, awayClub: string): boolean {
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

async function main() {
  const matches = await prisma.match.findMany({
    select: {
      id: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      homePenaltyScore: true,
      awayPenaltyScore: true,
      homePenaltyAttempts: true,
      awayPenaltyAttempts: true,
      group: { select: { category: { select: { slug: true } } } },
      homeTeam: { select: { club: { select: { name: true } } } },
      awayTeam: { select: { club: { select: { name: true } } } },
      events: {
        where: {
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
      },
    },
  });

  let updated = 0;

  for (const m of matches) {
    const homeClub = m.homeTeam.club.name;
    const awayClub = m.awayTeam.club.name;

    let scores = rebuildScoresFromEvents(m.events, m.homeTeamId, m.awayTeamId);

    const categorySlug = m.group?.category?.slug;

    // Referência 5x6 só para Sub-12 Bebedouro x LG — nunca em lote para outras categorias.
    if (
      categorySlug === "sub-12" &&
      isBebedouroLgMatch(homeClub, awayClub)
    ) {
      const pen = buildPenaltyScoreFromAttempts(
        BEBEDOURO_LG_PENALTY_REFERENCE.homeAttempts,
        BEBEDOURO_LG_PENALTY_REFERENCE.awayAttempts
      );
      scores = {
        homeScore: 0,
        awayScore: 0,
        homePenaltyScore: pen.homeScore,
        awayPenaltyScore: pen.awayScore,
        homePenaltyAttempts: pen.homeAttempts,
        awayPenaltyAttempts: pen.awayAttempts,
        homePenaltyKicks: pen.homePenaltyKicks,
        awayPenaltyKicks: pen.awayPenaltyKicks,
        inPenaltyShootout: true,
      };
    }

    const changed =
      m.homeScore !== scores.homeScore ||
      m.awayScore !== scores.awayScore ||
      m.homePenaltyScore !== scores.homePenaltyScore ||
      m.awayPenaltyScore !== scores.awayPenaltyScore ||
      JSON.stringify(m.homePenaltyAttempts) !==
        JSON.stringify(scores.homePenaltyAttempts) ||
      JSON.stringify(m.awayPenaltyAttempts) !==
        JSON.stringify(scores.awayPenaltyAttempts);

    if (!changed) continue;

    await prisma.match.update({
      where: { id: m.id },
      data: {
        homeScore: scores.homeScore,
        awayScore: scores.awayScore,
        homePenaltyScore: scores.homePenaltyScore,
        awayPenaltyScore: scores.awayPenaltyScore,
        ...(scores.homePenaltyAttempts.length > 0
          ? { homePenaltyAttempts: scores.homePenaltyAttempts }
          : {}),
        ...(scores.awayPenaltyAttempts.length > 0
          ? { awayPenaltyAttempts: scores.awayPenaltyAttempts }
          : {}),
      },
    });
    updated += 1;
    if (scores.homePenaltyScore + scores.awayPenaltyScore > 0) {
      console.log(
        `${m.id}: ${scores.homeScore}x${scores.awayScore} (reg) · Pen ${scores.homePenaltyScore}x${scores.awayPenaltyScore} [${formatAttemptsSequence(scores.homePenaltyAttempts)} / ${formatAttemptsSequence(scores.awayPenaltyAttempts)}]`
      );
    }
  }

  console.log(`Partidas atualizadas: ${updated}/${matches.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
