import type { ChampionshipSponsorPlacement } from "@prisma/client";

export const CHAMPIONSHIP_SPONSOR_PLACEMENT_LABELS: Record<
  ChampionshipSponsorPlacement,
  string
> = {
  SIDEBAR_LEFT: "Barra lateral esquerda",
  SIDEBAR_RIGHT: "Barra lateral direita",
};
