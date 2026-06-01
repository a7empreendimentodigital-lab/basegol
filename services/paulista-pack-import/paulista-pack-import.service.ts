import { runStructuredScheduleImport } from "@/services/schedule-import/schedule-import.service";
import { paulistaPackToSchedules } from "@/services/paulista-pack-import/paulista-pack-convert";
import { loadPaulistaPack, loadPaulistaPackFromJsonFile } from "@/services/paulista-pack-import/paulista-pack-loader";
import type { PaulistaPack } from "@/services/paulista-pack-import/paulista-pack.types";

export type PaulistaPackImportInput = {
  championshipId: string;
  createdById?: string;
  participantsOnly?: boolean;
  autoCreateCategory?: boolean;
  categoryId?: string;
  /** Caminho da pasta com CSVs ou arquivo .json */
  sourcePath?: string;
  /** Buffer JSON (upload admin) */
  jsonBuffer?: Buffer;
  fileName?: string;
};

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

export async function runPaulistaPackImport(input: PaulistaPackImportInput) {
  const pack = input.jsonBuffer
    ? (JSON.parse(input.jsonBuffer.toString("utf8")) as {
        competitions?: PaulistaPack["competitions"];
        group_teams?: PaulistaPack["groupTeams"];
        fixtures?: PaulistaPack["fixtures"];
      })
    : null;

  const loaded: PaulistaPack = pack
    ? {
        season: pack.competitions?.[0]?.season ?? 2026,
        competitions: pack.competitions ?? [],
        groupTeams: pack.group_teams ?? [],
        fixtures: pack.fixtures ?? [],
      }
    : loadPaulistaPack(input.sourcePath!);

  if (!loaded.groupTeams.length) {
    throw new Error("Pacote sem group_teams / participantes.");
  }

  const schedules = paulistaPackToSchedules(loaded);
  const fileName =
    input.fileName ??
    (input.sourcePath?.endsWith(".json")
      ? input.sourcePath.split("/").pop()!
      : "paulista-pack-fpf");

  return runStructuredScheduleImport({
    championshipId: input.championshipId,
    schedules,
    fileName,
    createdById: input.createdById,
    participantsOnly: input.participantsOnly,
    autoCreateCategory: input.autoCreateCategory !== false,
    categoryId: input.categoryId,
    sourceLabel: "Pacote FPF Paulista",
  });
}

export { loadPaulistaPack, loadPaulistaPackFromJsonFile, paulistaPackToSchedules };
