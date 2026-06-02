import { existsSync } from "node:fs";
import path from "node:path";

/** Pasta padrão do pacote FPF no repositório (CSVs oficiais). */
export const DEFAULT_FPF_PACK_DIR = path.join(process.cwd(), "data/fpf-2026");

export function resolveFpfPackDir(): string {
  const fromEnv = process.env.FPF_PACK_DIR?.trim();
  if (fromEnv && existsSync(path.join(fromEnv, "fixtures.csv"))) {
    return fromEnv;
  }
  if (existsSync(path.join(DEFAULT_FPF_PACK_DIR, "fixtures.csv"))) {
    return DEFAULT_FPF_PACK_DIR;
  }
  throw new Error(
    "Pacote FPF não encontrado. Coloque fixtures.csv e group_teams.csv em data/fpf-2026/ ou defina FPF_PACK_DIR."
  );
}
