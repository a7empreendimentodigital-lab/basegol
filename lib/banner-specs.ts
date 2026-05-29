import type { BannerPlacement } from "@prisma/client";

export type BannerSpec = {
  /** Largura exata da arte (px) */
  widthPx: number;
  /** Altura exata da arte (px) */
  heightPx: number;
  /** Texto curto para o admin */
  summary: string;
};

/** Tamanhos oficiais para exportar artes (PNG/WebP, 72–144 dpi). */
export const BANNER_SPECS: Record<BannerPlacement, BannerSpec> = {
  HERO_CAROUSEL: {
    widthPx: 1920,
    heightPx: 390,
    summary: "Carrossel principal — 1920 × 390 px",
  },
  SIDEBAR_LEFT: {
    widthPx: 264,
    heightPx: 320,
    summary: "Barra lateral esquerda — 264 × 320 px",
  },
  SIDEBAR_RIGHT: {
    widthPx: 268,
    heightPx: 250,
    summary: "Barra lateral direita (abaixo das infos) — 268 × 250 px",
  },
};

export function bannerSpecHint(placement: BannerPlacement): string {
  const s = BANNER_SPECS[placement];
  return `${s.summary}. Exporte exatamente ${s.widthPx}×${s.heightPx} px (proporção fixa; a imagem usa object-cover na tela).`;
}

export function bannerDisplaySize(placement: BannerPlacement): { width: number; height: number } {
  const s = BANNER_SPECS[placement];
  return { width: s.widthPx, height: s.heightPx };
}
