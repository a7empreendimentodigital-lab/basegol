import { normalizeImageSrc } from "@/lib/image-url";
import { formatClubDisplayName, normalizeClubName } from "@/lib/normalize-name";
import { slugify } from "@/lib/utils";

const ADMIN_IMAGE_URL_FIELDS = [
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

export function prepareAdminPayload(entity: string, data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };

  if (typeof out.slug === "string" && !out.slug.trim()) {
    delete out.slug;
  }

  if (typeof out.name === "string" && !out.slug) {
    out.slug = slugify(out.name);
  }
  if (entity === "clubs" && typeof out.name === "string") {
    const clubName = formatClubDisplayName(out.name);
    out.name = clubName;
    out.normalizedName = normalizeClubName(clubName);
    if (typeof out.city === "string" && out.city) {
      out.city = formatClubDisplayName(out.city);
    }
    if (typeof out.shortName === "string" && out.shortName) {
      out.shortName = formatClubDisplayName(out.shortName);
    }
  }
  if (typeof out.title === "string" && !out.slug && entity === "news") {
    out.slug = slugify(out.title);
  }
  if (typeof out.firstName === "string" && typeof out.lastName === "string" && !out.slug) {
    out.slug = slugify(`${out.firstName}-${out.lastName}`);
  }

  if (out.startDate === "") out.startDate = null;
  if (out.endDate === "") out.endDate = null;
  if (out.publishedAt === "") out.publishedAt = null;
  if (out.startsAt === "") out.startsAt = null;
  if (out.endsAt === "") out.endsAt = null;
  if (out.expiresAt === "") out.expiresAt = null;

  const nullableIds = ["championshipId", "clubId", "athleteId", "categoryId", "groupId"];
  for (const field of nullableIds) {
    if (out[field] === "") out[field] = null;
  }

  const dateFields = ["startDate", "endDate", "publishedAt", "startsAt", "endsAt", "expiresAt", "birthDate"];
  for (const field of dateFields) {
    if (typeof out[field] === "string" && out[field]) {
      out[field] = new Date(out[field] as string).toISOString();
    }
  }

  if (typeof out.scheduledAt === "string" && out.scheduledAt) {
    out.scheduledAt = new Date(out.scheduledAt);
  }

  for (const field of ADMIN_IMAGE_URL_FIELDS) {
    if (typeof out[field] === "string") {
      const normalized = normalizeImageSrc(out[field] as string);
      out[field] = normalized ?? "";
    }
  }

  return out;
}
