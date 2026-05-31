/**
 * Regrava pênaltis e minutos da cronologia a partir dos eventos.
 * Uso: npx tsx scripts/repair-match-penalties-timeline.ts [matchId]
 * Sem matchId: repara Sub-11 e Sub-12 Bebedouro x LG (se existirem).
 */
import { rebuildScoresFromEvents } from "@/lib/match-live";
import { minuteForPhaseTransition } from "@/lib/match-event-minute";
import { formatAttemptsSequence } from "@/lib/match-penalties";
import { reconcileAndPersistScores } from "@/services/match-live.service";
import { prisma } from "@/lib/prisma";
import type { MatchEventType, MatchGamePhase } from "@prisma/client";

const PHASE_TYPES: MatchEventType[] = ["KICKOFF", "HALFTIME", "FULLTIME"];

function isBebedouroLg(home: string, away: string) {
  const h = home.toLowerCase();
  const a = away.toLowerCase();
  const hasLg = h.includes("lg futebol") || a.includes("lg futebol");
  const hasBb =
    h.includes("bebedouro") ||
    a.includes("bebedouro") ||
    h.includes("internacional") ||
    a.includes("internacional");
  return hasLg && hasBb;
}

function phaseFromDescription(desc: string): MatchGamePhase | null {
  const d = desc.toLowerCase();
  if (d.includes("1º") || d.includes("1o tempo")) return "PERIOD_1";
  if (d.includes("2º") || d.includes("2o tempo") || d.includes("segundo tempo"))
    return "PERIOD_2";
  if (d.includes("3º") || d.includes("3o tempo") || d.includes("terceiro tempo"))
    return "PERIOD_3";
  if (d.includes("pênalt") || d.includes("penalt") || d.includes("disputa"))
    return "PENALTIES";
  if (d.includes("encerr")) return "FINISHED";
  if (d.includes("intervalo")) return "INTERVAL_1";
  return null;
}

async function repairMatch(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: { include: { club: true } },
      awayTeam: { include: { club: true } },
      group: { include: { category: true } },
      events: { orderBy: [{ createdAt: "asc" }] },
    },
  });
  if (!match) {
    console.error("Partida não encontrada:", matchId);
    return;
  }

  console.log("\n---", match.group?.category?.name ?? "?", match.id);
  console.log(match.homeTeam.club.name, "x", match.awayTeam.club.name);

  let kick = 0;
  for (const ev of match.events) {
    if (ev.type === "PENALTY_GOAL" || ev.type === "PENALTY_MISS") {
      kick += 1;
      await prisma.matchEvent.update({
        where: { id: ev.id },
        data: { minute: kick, extraMinute: null },
      });
      continue;
    }
    if (PHASE_TYPES.includes(ev.type)) {
      const phase =
        phaseFromDescription(ev.description ?? "") ??
        (ev.type === "HALFTIME"
          ? "INTERVAL_1"
          : ev.type === "FULLTIME"
            ? "FINISHED"
            : "PERIOD_1");
      await prisma.matchEvent.update({
        where: { id: ev.id },
        data: { minute: minuteForPhaseTransition(phase) },
      });
    }
  }

  const events = await prisma.matchEvent.findMany({
    where: { matchId },
    orderBy: [{ minute: "asc" }, { createdAt: "asc" }],
    select: {
      type: true,
      teamId: true,
      description: true,
      minute: true,
      createdAt: true,
    },
  });

  await reconcileAndPersistScores(
    matchId,
    match.homeTeamId,
    match.awayTeamId,
    events
  );

  const updated = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      homeScore: true,
      awayScore: true,
      homePenaltyScore: true,
      awayPenaltyScore: true,
      homePenaltyAttempts: true,
      awayPenaltyAttempts: true,
    },
  });

  console.log(
    "Reg:",
    updated?.homeScore,
    "x",
    updated?.awayScore,
    "| Pen:",
    updated?.homePenaltyScore,
    "x",
    updated?.awayPenaltyScore
  );
  console.log(
    "Seq:",
    formatAttemptsSequence(
      (updated?.homePenaltyAttempts as ("O" | "X")[]) ?? []
    ),
    "/",
    formatAttemptsSequence(
      (updated?.awayPenaltyAttempts as ("O" | "X")[]) ?? []
    )
  );
}

async function main() {
  const argId = process.argv[2];
  if (argId) {
    await repairMatch(argId);
    return;
  }

  const matches = await prisma.match.findMany({
    include: {
      homeTeam: { include: { club: true } },
      awayTeam: { include: { club: true } },
      group: { include: { category: true } },
    },
  });

  for (const m of matches) {
    if (!isBebedouroLg(m.homeTeam.club.name, m.awayTeam.club.name)) continue;
    const cat = m.group?.category?.slug;
    if (cat !== "sub-11" && cat !== "sub-12") continue;

    const eventCount = await prisma.matchEvent.count({
      where: {
        matchId: m.id,
        type: { in: ["PENALTY_GOAL", "PENALTY_MISS", "GOAL", "KICKOFF"] },
      },
    });
    if (eventCount === 0) {
      console.log("Pulando (sem eventos):", cat, m.id);
      continue;
    }

    await repairMatch(m.id);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
