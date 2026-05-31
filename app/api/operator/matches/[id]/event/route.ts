import { getSessionUserOrThrow, hasRole } from "@/lib/access-control";
import type { MatchGamePhase } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { operatorActionSchema } from "@/utils/zod-schemas/operator.schemas";
import { canOperateMatch } from "@/services/operator.service";
import {
  enrichMatchForApi,
  reconcileAndPersistScores,
} from "@/services/match-live.service";
import {
  buildConfigUpdateData,
  buildPauseClockData,
  buildPhaseUpdateData,
  buildResumeClockData,
} from "@/services/match-phase.service";
import { pausePhaseClock } from "@/lib/match-phase";
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

function phaseEventForTransition(
  target: MatchGamePhase
): { type: MatchEventType; description: string } | null {
  switch (target) {
    case "PERIOD_1":
      return { type: "KICKOFF", description: "Início do 1º tempo" };
    case "PERIOD_2":
      return { type: "KICKOFF", description: "Início do 2º tempo" };
    case "PERIOD_3":
      return { type: "KICKOFF", description: "Início do 3º tempo" };
    case "INTERVAL_1":
    case "INTERVAL_2":
      return { type: "HALFTIME", description: "Intervalo" };
    case "PENALTIES":
      return { type: "KICKOFF", description: "Disputa de pênaltis" };
    case "FINISHED":
      return { type: "FULLTIME", description: "Encerramento" };
    default:
      return null;
  }
}

function legacyGoTo(
  action: string,
  match: Awaited<ReturnType<typeof prisma.match.findUnique>>
): { targetPhase: MatchGamePhase; startClock?: boolean } | null {
  if (!match) return null;
  switch (action) {
    case "START_MATCH":
      return { targetPhase: "PERIOD_1", startClock: true };
    case "HALFTIME":
      return { targetPhase: "INTERVAL_1", startClock: false };
    case "SECOND_HALF":
      return { targetPhase: "PERIOD_2", startClock: true };
    case "THIRD_HALF":
      return { targetPhase: "PERIOD_3", startClock: true };
    case "PENALTY_SHOOTOUT":
      return { targetPhase: "PENALTIES", startClock: false };
    case "END_MATCH":
      return { targetPhase: "FINISHED", startClock: false };
    default:
      return null;
  }
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

    const now = new Date();

    if (payload.action === "SET_MATCH_CONFIG" || payload.action === "SET_CLOCK") {
      await prisma.match.update({
        where: { id: matchId },
        data: buildConfigUpdateData(match, {
          totalPeriods: payload.totalPeriods ?? payload.periodCount,
          hasIntervals: payload.hasIntervals,
          hasPenaltyShootout: payload.hasPenaltyShootout,
          penaltyBonusPointsEnabled: payload.penaltyBonusPointsEnabled,
          phaseDurationSeconds: payload.phaseDurationSeconds,
          periodLengthMin: payload.periodLengthMin,
          showTotalGameTime: payload.showTotalGameTime,
        }),
      });
    } else if (payload.action === "PAUSE_CLOCK") {
      await prisma.match.update({
        where: { id: matchId },
        data: buildPauseClockData(match, now),
      });
    } else if (payload.action === "RESUME_CLOCK") {
      await prisma.match.update({
        where: { id: matchId },
        data: buildResumeClockData(match, now),
      });
    } else if (
      payload.action === "GO_TO_PHASE" ||
      payload.action === "START_MATCH" ||
      payload.action === "HALFTIME" ||
      payload.action === "SECOND_HALF" ||
      payload.action === "THIRD_HALF" ||
      payload.action === "PENALTY_SHOOTOUT" ||
      payload.action === "END_MATCH"
    ) {
      const legacy = legacyGoTo(payload.action, match);
      const targetPhase =
        payload.targetPhase ?? legacy?.targetPhase ?? ("FINISHED" as MatchGamePhase);
      const startClock =
        payload.startClock ?? legacy?.startClock ?? false;

      if (payload.action === "START_MATCH" || payload.action === "GO_TO_PHASE") {
        if (payload.periodLengthMin != null || payload.periodCount != null) {
          await prisma.match.update({
            where: { id: matchId },
            data: buildConfigUpdateData(match, {
              totalPeriods: payload.periodCount ?? payload.totalPeriods,
              periodLengthMin: payload.periodLengthMin,
              phaseDurationSeconds:
                payload.phaseDurationSeconds ??
                (payload.periodLengthMin != null
                  ? payload.periodLengthMin * 60
                  : undefined),
            }),
          });
        }
      }

      const fresh = await prisma.match.findUnique({ where: { id: matchId } });
      if (!fresh) return fail("Partida não encontrada", 404);

      const phaseUpdate = buildPhaseUpdateData(fresh, {
        targetPhase,
        startClock,
        phaseDurationSeconds: payload.phaseDurationSeconds,
      });

      await prisma.match.update({
        where: { id: matchId },
        data: phaseUpdate,
      });

      const ev = phaseEventForTransition(targetPhase);
      if (ev) {
        const paused = pausePhaseClock(fresh, now);
        await prisma.matchEvent.create({
          data: {
            matchId,
            type: ev.type,
            minute: paused.minute,
            extraMinute,
            description: payload.description ?? ev.description,
          },
        });
      }
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
  } catch (e) {
    console.error(e);
    return fail("Falha operacional", 400);
  }
}
