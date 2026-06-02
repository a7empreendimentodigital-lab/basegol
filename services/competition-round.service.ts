import { prisma } from "@/lib/prisma";

/** Garante fase, turno e registro de rodada do Paulista de base. */
export async function ensurePaulistaCompetitionRound(
  championshipId: string,
  roundNumber: number
) {
  const phaseSlug = "fase-01";
  const turnSlug = "primeiro-turno";
  let phase = await prisma.competitionPhase.findFirst({
    where: { championshipId, slug: phaseSlug },
  });
  if (!phase) {
    phase = await prisma.competitionPhase.create({
      data: { championshipId, name: "FASE 01", slug: phaseSlug },
    });
  }
  let turn = await prisma.competitionTurn.findFirst({
    where: { phaseId: phase.id, slug: turnSlug },
  });
  if (!turn) {
    turn = await prisma.competitionTurn.create({
      data: { phaseId: phase.id, name: "PRIMEIRO TURNO", slug: turnSlug },
    });
  }
  const label = `Rodada ${String(roundNumber).padStart(2, "0")}`;
  let round = await prisma.competitionRound.findUnique({
    where: {
      championshipId_phaseId_turnId_number: {
        championshipId,
        phaseId: phase.id,
        turnId: turn.id,
        number: roundNumber,
      },
    },
  });
  if (!round) {
    round = await prisma.competitionRound.create({
      data: {
        championshipId,
        phaseId: phase.id,
        turnId: turn.id,
        number: roundNumber,
        label,
      },
    });
  } else if (!round.label) {
    round = await prisma.competitionRound.update({
      where: { id: round.id },
      data: { label },
    });
  }
  return { phase, turn, round };
}
