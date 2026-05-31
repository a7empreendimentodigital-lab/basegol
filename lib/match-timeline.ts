export type TimelineEvent = {
  id: string;
  type: string;
  minute: number;
  extraMinute?: number | null;
  description?: string | null;
  createdAt?: Date | string | null;
};

const PHASE_EVENT_TYPES = new Set(["KICKOFF", "HALFTIME", "FULLTIME"]);

export function isPhaseTimelineEvent(type: string): boolean {
  return PHASE_EVENT_TYPES.has(type);
}

/** Remove entradas duplicadas (mesmo tipo, minuto e descrição). */
export function dedupeTimelineEvents<T extends TimelineEvent>(events: T[]): T[] {
  const seen = new Set<string>();
  return events.filter((ev) => {
    const key = `${ev.type}|${ev.minute}|${(ev.description ?? "").trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function formatTimelineMinute(
  ev: Pick<TimelineEvent, "type" | "minute" | "extraMinute">
): string {
  if (isPhaseTimelineEvent(ev.type)) {
    return "—";
  }
  if (ev.extraMinute && ev.extraMinute > 0) {
    return `${ev.minute}+${ev.extraMinute}'`;
  }
  return `${ev.minute}'`;
}

export function timelineEventTitle(
  ev: Pick<TimelineEvent, "type" | "description">,
  labels: Record<string, string>
): string {
  const desc = ev.description?.trim();
  if (desc) return desc;
  return labels[ev.type] ?? ev.type.replace(/_/g, " ");
}
