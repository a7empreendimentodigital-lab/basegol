import type { PlayerPosition } from "@prisma/client";

const POSITION_ALIASES: Record<string, PlayerPosition> = {
  gk: "GK",
  gol: "GK",
  goleiro: "GK",
  gr: "GK",
  cb: "CB",
  zag: "CB",
  zagueiro: "CB",
  def: "CB",
  lb: "LB",
  le: "LB",
  lateral_esquerdo: "LB",
  rb: "RB",
  ld: "RB",
  lateral_direito: "RB",
  cdm: "CDM",
  vol: "CDM",
  volante: "CDM",
  cm: "CM",
  meia: "CM",
  mei: "CM",
  cam: "CAM",
  meia_atacante: "CAM",
  meiaatacante: "CAM",
  lw: "LW",
  pe: "LW",
  rw: "RW",
  pd: "RW",
  st: "ST",
  at: "ST",
  ata: "ST",
  atacante: "ST",
  cf: "CF",
  centroavante: "CF",
  sa: "ST",
};

export function mapCsvPosition(raw: string | undefined): PlayerPosition {
  if (!raw?.trim()) return "CM";
  const key = raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w]+/g, "_");
  return POSITION_ALIASES[key] ?? "CM";
}
