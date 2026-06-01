import { paulistaPackToSchedules } from "@/services/paulista-pack-import/paulista-pack-convert";
import { loadPaulistaPack, loadPaulistaPackFromJsonFile } from "@/services/paulista-pack-import/paulista-pack-loader";
import { parsePaulistaPackBuffer } from "@/services/paulista-pack-import/paulista-pack-preview";
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

export async function runPaulistaPackImport(input: PaulistaPackImportInput) {
  const { runStructuredScheduleImport } = await import(
    "@/services/schedule-import/schedule-import.service"
  );

  const loaded: PaulistaPack = input.jsonBuffer
    ? parsePaulistaPackBuffer(input.jsonBuffer)
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
export { previewPaulistaPack, parsePaulistaPackBuffer } from "@/services/paulista-pack-import/paulista-pack-preview";
