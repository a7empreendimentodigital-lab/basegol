import { paulistaPackToSchedules } from "@/services/paulista-pack-import/paulista-pack-convert";
import type { PaulistaPack } from "@/services/paulista-pack-import/paulista-pack.types";

export function parsePaulistaPackBuffer(buffer: Buffer): PaulistaPack {
  const raw = JSON.parse(buffer.toString("utf8")) as {
    competitions?: PaulistaPack["competitions"];
    group_teams?: PaulistaPack["groupTeams"];
    fixtures?: PaulistaPack["fixtures"];
  };
  return {
    season: raw.competitions?.[0]?.season ?? 2026,
    competitions: raw.competitions ?? [],
    groupTeams: raw.group_teams ?? [],
    fixtures: raw.fixtures ?? [],
  };
}

export function previewPaulistaPack(pack: PaulistaPack) {
  const schedules = paulistaPackToSchedules(pack);
  return {
    season: pack.season,
    categories: schedules.map((s) => ({
      categoryHint: s.categoryHint,
      participants: s.participants.length,
      matches: s.matches.length,
      warnings: s.warnings,
    })),
    totals: {
      participants: schedules.reduce((n, s) => n + s.participants.length, 0),
      matches: schedules.reduce((n, s) => n + s.matches.length, 0),
    },
  };
}
