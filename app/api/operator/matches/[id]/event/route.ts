import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import { pauseClockData, resumeClockData } from "@/lib/match-live";
import { prisma } from "@/lib/prisma";
import { operatorActionSchema } from "@/utils/zod-schemas/operator.schemas";
import { canOperateMatch } from "@/services/operator.service";
import {
  enrichMatchForApi,
  reconcileAndPersistScores,
} from "@/services/match-live.service";
import { fail, ok } from "@/utils/api-response";
import { writeAuditLog } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/utils/audit-actions";
import type { MatchEventType } from "@prisma/client";

const matchReturnInclude = {
  statistics: true,
  events: { orderBy: { minute: "asc" as const }, include: { athlete: true } },
  homeTeam: { include: { club: true } },
  awayTeam: { include: { club: true } },
  group: { include: { category: { include: { championship: true } } } },
} as const;

async function descriptionWithAthlete(
  athleteId: string | undefined,
  fallback: string,
  custom?: string
) {
  if (custom?.trim()) return custom;
  if (!athleteId) return fallback;
  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
    select: { firstName: true, lastName: true },
  });
  if (!athlete) return fallback;
  return `${athlete.firstName} ${athlete.lastName}`;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: matchId } = await params;
    const user = await getSessionUserOrThrow();
    const role = user.role.slug.toUpperCase();
    if (!hasRole(role, ["OPERADOR_DE_PARTIDA", "SUPER_ADMIN", "ADMIN_LIGA"])) {
      return fail("Sem permissão", 403);
    }
    if (
      !(await canOperateMatch(
        user.id,
        matchId,
        hasRole(role, ["SUPER_ADMIN", "ADMIN_LIGA"])
      ))
    ) {
      return fail("Operador não autorizado para esta partida", 403);
    }

    const parsed = operatorActionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail("Payload inválido", 400, parsed.error.flatten());
    }
    const payload = parsed.data;
    const minute = payload.minute ?? 0;
    const extraMinute = payload.extraMinute ?? undefined;

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return fail("Partida não encontrada", 404);

    const teamIdFromSide = (side?: "home" | "away") =>
      side === "home" ? match.homeTeamId : side === "away" ? match.awayTeamId : undefined;

    if (payload.action === "START_MATCH") {
      const now = new Date();
      await prisma.match.update({
        where: { id: matchId },
        data: {
          status: "LIVE",
          matchPeriod: "FIRST_HALF",
          elapsedSeconds: 0,
          clockRunning: true,
          clockStartedAt: now,
          minute: 0,
        },
      });
      await prisma.matchEvent.create({
        data: {
          matchId,
          type: "KICKOFF",
          minute,
          extraMinute,
          description: payload.description ?? "Início de jogo",
        },
      });
    } else if (payload.action === "HALFTIME") {
      const paused = pauseClockData(match);
      await prisma.match.update({
        where: { id: matchId },
        data: { status: "HALFTIME", matchPeriod: "HALFTIME", ...paused },
      });
      await prisma.matchEvent.create({
        data: {
          matchId,
          type: "HALFTIME",
          minute: paused.minute,
          extraMinute,
          description: payload.description ?? "Intervalo",
        },
      });
    } else if (payload.action === "SECOND_HALF") {
      const paused = pauseClockData(match);
      await prisma.match.update({
        where: { id: matchId },
        data: {
          status: "LIVE",
          matchPeriod: "SECOND_HALF",
          elapsedSeconds: paused.elapsedSeconds,
          ...resumeClockData({ ...match, elapsedSeconds: paused.elapsedSeconds }),
        },
      });
      await prisma.matchEvent.create({
        data: {
          matchId,
          type: "KICKOFF",
          minute: paused.minute,
          extraMinute,
          description: payload.description ?? "Segundo tempo",
        },
      });
    } else if (payload.action === "THIRD_HALF") {
      const paused = pauseClockData(match);
      await prisma.match.update({
        where: { id: matchId },
        data: {
          status: "LIVE",
          matchPeriod: "THIRD_HALF",
          elapsedSeconds: paused.elapsedSeconds,
          ...resumeClockData({ ...match, elapsedSeconds: paused.elapsedSeconds }),
        },
      });
      await prisma.matchEvent.create({
        data: {
          matchId,
          type: "KICKOFF",
          minute: paused.minute,
          extraMinute,
          description: payload.description ?? "Terceiro tempo",
        },
      });
    } else if (payload.action === "PENALTY_SHOOTOUT") {
      const paused = pauseClockData(match);
      await prisma.match.update({
        where: { id: matchId },
        data: {
          status: "LIVE",
          matchPeriod: "PENALTY_SHOOTOUT",
          ...paused,
        },
      });
      await prisma.matchEvent.create({
        data: {
          matchId,
          type: "KICKOFF",
          minute: paused.minute,
          extraMinute,
          description: payload.description ?? "Disputa de pênaltis",
        },
      });
    } else if (payload.action === "END_MATCH") {
      const paused = pauseClockData(match);
      await prisma.match.update({
        where: { id: matchId },
        data: { status: "FINISHED", matchPeriod: "FINISHED", ...paused },
      });
      await prisma.matchEvent.create({
        data: {
          matchId,
          type: "FULLTIME",
          minute,
          extraMinute,
          description: payload.description ?? "Encerramento",
        },
      });
    } else if (
      payload.action === "GOAL_HOME" ||
      payload.action === "GOAL_AWAY" ||
      payload.action === "GOAL"
    ) {
      const resolvedTeamId =
        payload.teamId ??
        (payload.action === "GOAL_HOME"
          ? match.homeTeamId
          : payload.action === "GOAL_AWAY"
            ? match.awayTeamId
            : teamIdFromSide(payload.side));

      await prisma.match.update({
        where: { id: matchId },
        data: { minute },
      });
      await prisma.matchEvent.create({
        data: {
          matchId,
          type: "GOAL",
          minute,
          extraMinute,
          teamId: resolvedTeamId,
          athleteId: payload.athleteId,
          description: await descriptionWithAthlete(payload.athleteId, "Gol", payload.description),
        },
      });
    } else if (payload.action === "PENALTY_GOAL") {
      const resolvedTeamId = payload.teamId ?? teamIdFromSide(payload.side);
      await prisma.match.update({
        where: { id: matchId },
        data: { minute },
      });
      await prisma.matchEvent.create({
        data: {
          matchId,
          type: "PENALTY_GOAL",
          minute,
          extraMinute,
          teamId: resolvedTeamId,
          athleteId: payload.athleteId,
          description: await descriptionWithAthlete(
            payload.athleteId,
            "Pênalti convertido",
            payload.description
          ),
        },
      });
    } else if (payload.action === "PENALTY_MISS") {
      await prisma.matchEvent.create({
        data: {
          matchId,
          type: "PENALTY_MISS",
          minute,
          extraMinute,
          teamId: payload.teamId ?? teamIdFromSide(payload.side),
          athleteId: payload.athleteId,
          description: await descriptionWithAthlete(
            payload.athleteId,
            "Pênalti perdido",
            payload.description
          ),
        },
      });
    } else if (payload.action === "YELLOW_CARD" || payload.action === "RED_CARD") {
      const cardLabel = payload.action === "YELLOW_CARD" ? "Cartão amarelo" : "Cartão vermelho";
      await prisma.matchEvent.create({
        data: {
          matchId,
          type: payload.action as MatchEventType,
          minute,
          extraMinute,
          teamId: payload.teamId ?? teamIdFromSide(payload.side),
          athleteId: payload.athleteId,
          description: await descriptionWithAthlete(
            payload.athleteId,
            cardLabel,
            payload.description
          ),
        },
      });
    } else if (payload.action === "SUBSTITUTION") {
      await prisma.matchEvent.create({
        data: {
          matchId,
          type: "SUBSTITUTION",
          minute,
          extraMinute,
          teamId: payload.teamId ?? teamIdFromSide(payload.side),
          description: payload.description ?? "Substituição",
        },
      });
    } else if (payload.action === "UPDATE_STATS" && payload.stats) {
      await prisma.matchStatistic.upsert({
        where: { matchId },
        update: payload.stats,
        create: { matchId, ...payload.stats },
      });
    }

    const events = await prisma.matchEvent.findMany({
      where: { matchId },
      orderBy: [{ minute: "asc" }, { createdAt: "asc" }],
    });
    await reconcileAndPersistScores(matchId, match.homeTeamId, match.awayTeamId, events);

    const updated = await prisma.match.findUnique({
      where: { id: matchId },
      include: matchReturnInclude,
    });

    await writeAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.MATCH_LIVE_UPDATED,
      entity: "Match",
      entityId: matchId,
      metadata: { action: payload.action, minute },
    });

    return ok(updated ? enrichMatchForApi(updated) : null);
  } catch {
    return fail("Falha operacional", 400);
  }
}
