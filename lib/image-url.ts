/**
 * URLs de imagem vindas do banco ou de /public.
 * Nunca use prefixo "/public/" na URL.
 * Não há fallback visual automático — retorne null quando não houver imagem válida.
 */

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
 * Normaliza e valida URL de imagem. Retorna null se vazio ou inválido.
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

export function normalizeRecordImageFields<T extends Record<string, unknown>>(record: T): T {
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
