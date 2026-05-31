/**
 * Recalcula placar regulamentar e pênaltis de todas as partidas a partir dos eventos.
 * Uso: npx tsx scripts/reconcile-match-penalties.ts
 */
import { rebuildScoresFromEvents } from "@/lib/match-live";
import { prisma } from "@/lib/prisma";

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
    const scores = rebuildScoresFromEvents(m.events, m.homeTeamId, m.awayTeamId);
    const changed =
      m.homeScore !== scores.homeScore ||
      m.awayScore !== scores.awayScore ||
      m.homePenaltyScore !== scores.homePenaltyScore ||
      m.awayPenaltyScore !== scores.awayPenaltyScore;

    if (!changed && scores.homePenaltyAttempts.length === 0) continue;

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
        `${m.id}: ${scores.homeScore}x${scores.awayScore} (reg) · Pen ${scores.homePenaltyScore}x${scores.awayPenaltyScore} [${scores.homePenaltyAttempts.join("")} / ${scores.awayPenaltyAttempts.join("")}]`
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
