import { STATIC_ASSETS } from "@/lib/image-url";

/** Altura fixa dos banners de topo das páginas públicas (px). */
export const PAGE_TOP_BANNER_HEIGHT_PX = 250;

export const PAGE_TOP_BANNERS = {
  aoVivo: STATIC_ASSETS.bgAoVivo,
  campeonatos: STATIC_ASSETS.bgCampeonato,
  clubes: STATIC_ASSETS.bgCampeonato,
  tabelas: STATIC_ASSETS.bgTabelas,
  favoritos: STATIC_ASSETS.bgFavoritos,
} as const;
