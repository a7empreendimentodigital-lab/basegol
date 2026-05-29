export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024; // 5MB

export const UPLOAD_ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
] as const;

export const UPLOAD_ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const MEDIA_CATEGORIES = [
  "logo",
  "favicon",
  "banner",
  "crest",
  "athlete",
  "news",
  "sponsor",
  "championship",
  "category",
  "login",
  "splash",
  "general",
  "avatar",
] as const;

export type MediaCategory = (typeof MEDIA_CATEGORIES)[number];
