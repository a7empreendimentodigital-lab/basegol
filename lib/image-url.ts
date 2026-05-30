/**
 * URLs de arquivos em /public (servidos na raiz do site).
 * Nunca use prefixo "/public/" na URL.
 */
export const STATIC_ASSETS = {
  favicon: "/assets/favicon.webp",
  logo: "/assets/logo.webp",
  logoLogin: "/assets/logo2.webp",
  bannerPrincipal: "/assets/bannerpricipal.webp",
  bola: "/assets/bola.svg",
  bgAoVivo: "/assets/bg-ao-vivo.webp",
  bgCampeonato: "/assets/bg-campeonato.webp",
  bgTabelas: "/assets/bg-tabelas.webp",
  bgFavoritos: "/assets/bg-favoritos.webp",
  icon192: "/icons/icon-192.svg",
  icon512: "/icons/icon-512.svg",
} as const;

const BRASAO_FOLDER = "/assets/brasao/";

const IMAGE_URL_FIELDS = [
  "logoUrl",
  "faviconUrl",
  "mobileLogoUrl",
  "loginBackgroundUrl",
  "homeHeroBackgroundUrl",
  "splashScreenUrl",
  "crestUrl",
  "bannerUrl",
  "imageUrl",
  "photoUrl",
] as const;

/**
 * Normaliza caminhos de imagem para produção (Vercel/Linux é case-sensitive).
 * - Remove prefixo errado `/public`
 * - Garante barra inicial em paths locais
 * - Padroniza pasta de brasões: `/assets/brasao/` (minúsculo)
 */
export function normalizeImageSrc(url: string | null | undefined): string | null {
  if (url == null) return null;

  let value = url.trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) return value;

  if (value.startsWith("/public/")) {
    value = value.slice("/public".length);
  } else if (value.startsWith("public/")) {
    value = `/${value.slice("public".length)}`;
  }

  if (!value.startsWith("/")) {
    value = `/${value}`;
  }

  value = value.replace(/\/assets\/brasao\//gi, BRASAO_FOLDER);

  return value;
}

export function normalizeImageSrcOr(
  url: string | null | undefined,
  fallback: string
): string {
  return normalizeImageSrc(url) ?? fallback;
}

export function isLocalPublicImageSrc(src: string): boolean {
  return (
    src.startsWith("/assets/") ||
    src.startsWith("/uploads/") ||
    src.startsWith("/icons/")
  );
}

/** Imagens locais e remotas: evita otimizador quebrar paths em produção. */
export function shouldUnoptimizeImageSrc(src: string): boolean {
  return isLocalPublicImageSrc(src) || /^https?:\/\//i.test(src);
}

export function normalizeRecordImageFields<T extends Record<string, unknown>>(
  record: T
): T {
  const out = { ...record };
  for (const field of IMAGE_URL_FIELDS) {
    if (field in out && typeof out[field] === "string") {
      (out as Record<string, unknown>)[field] = normalizeImageSrc(out[field] as string);
    }
  }
  return out;
}

export function normalizeBrandConfig<T extends Record<string, unknown>>(brand: T): T {
  return normalizeRecordImageFields(brand);
}
