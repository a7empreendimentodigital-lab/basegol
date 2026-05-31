import type { Metadata } from "next";
import type { MetadataRoute } from "next";
import { normalizeImageSrc } from "@/lib/image-url";
import { PWA_ICONS } from "@/lib/pwa-icons";

export type BrandIconSource = {
  faviconUrl?: string | null;
  systemName?: string | null;
  updatedAt?: Date | string | null;
};

export function getSiteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

/** Query string para forçar atualização no navegador após trocar o favicon no admin. */
export function brandIconVersion(brand: BrandIconSource | null | undefined): string {
  if (!brand?.updatedAt) return "";
  const t =
    brand.updatedAt instanceof Date
      ? brand.updatedAt.getTime()
      : new Date(brand.updatedAt).getTime();
  return Number.isFinite(t) ? `?v=${t}` : "";
}

export function resolveBrandFaviconSrc(brand: BrandIconSource | null | undefined): string | null {
  const fromBrand = normalizeImageSrc(brand?.faviconUrl);
  if (fromBrand) return fromBrand;
  return PWA_ICONS.favicon32;
}

export function withIconCacheBust(src: string, brand: BrandIconSource | null | undefined): string {
  const v = brandIconVersion(brand);
  if (!v || src.includes("?")) return src;
  return `${src}${v}`;
}

export function mimeFromImageUrl(url: string): string {
  const path = url.split("?")[0]?.toLowerCase() ?? "";
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  return "image/png";
}

function absoluteIconUrl(src: string, brand: BrandIconSource | null | undefined): string {
  const busted = withIconCacheBust(src, brand);
  if (/^https?:\/\//i.test(busted)) return busted;
  return `${getSiteOrigin()}${busted.startsWith("/") ? busted : `/${busted}`}`;
}

export function buildMetadataIcons(brand: BrandIconSource | null | undefined): Metadata["icons"] {
  const favicon = resolveBrandFaviconSrc(brand);
  if (!favicon) {
    return {
      icon: [
        { url: PWA_ICONS.favicon16, sizes: "16x16", type: "image/png" },
        { url: PWA_ICONS.favicon32, sizes: "32x32", type: "image/png" },
      ],
      apple: [{ url: PWA_ICONS.appleTouch, sizes: "180x180", type: "image/png" }],
      shortcut: PWA_ICONS.favicon32,
    };
  }

  const busted = withIconCacheBust(favicon, brand);
  const type = mimeFromImageUrl(favicon);
  const abs = absoluteIconUrl(favicon, brand);

  return {
    icon: [
      { url: busted, type },
      { url: abs, sizes: "32x32", type },
      { url: abs, sizes: "192x192", type },
    ],
    apple: [{ url: abs, sizes: "180x180", type }],
    shortcut: busted,
  };
}

export function buildManifestIcons(
  brand: BrandIconSource | null | undefined
): MetadataRoute.Manifest["icons"] {
  const favicon = resolveBrandFaviconSrc(brand);
  if (!favicon) {
    return [
      { src: PWA_ICONS.icon192, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: PWA_ICONS.icon512, sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: PWA_ICONS.icon192Maskable,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: PWA_ICONS.icon512Maskable,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ];
  }

  const abs = absoluteIconUrl(favicon, brand);
  const type = mimeFromImageUrl(favicon);

  return [
    { src: abs, sizes: "192x192", type, purpose: "any" },
    { src: abs, sizes: "512x512", type, purpose: "any" },
    { src: abs, sizes: "192x192", type, purpose: "maskable" },
    { src: abs, sizes: "512x512", type, purpose: "maskable" },
  ];
}
