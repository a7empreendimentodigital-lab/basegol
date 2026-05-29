import type { BannerPlacement } from "@prisma/client";
import { bannerSpecHint } from "@/lib/banner-specs";

export const BANNER_PLACEMENT_LABELS: Record<BannerPlacement, string> = {
  HERO_CAROUSEL: "Carrossel principal (home)",
  SIDEBAR_LEFT: "Barra lateral esquerda",
  SIDEBAR_RIGHT: "Barra lateral direita (home)",
};

export const BANNER_PLACEMENT_HINTS: Record<BannerPlacement, string> = {
  HERO_CAROUSEL: bannerSpecHint("HERO_CAROUSEL"),
  SIDEBAR_LEFT: bannerSpecHint("SIDEBAR_LEFT"),
  SIDEBAR_RIGHT: bannerSpecHint("SIDEBAR_RIGHT"),
};
