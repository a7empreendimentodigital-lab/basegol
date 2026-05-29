import { z } from "zod";
import { dateTimeInputsToISO } from "@/lib/datetime-input";
import { optionalImageUrlNullable, requiredMediaUrl } from "@/utils/zod-schemas/media-url";

/** Slug vazio no formulário vira undefined; o servidor gera a partir do nome. */
export const optionalSlug = z
  .union([z.string(), z.literal(""), z.null(), z.undefined()])
  .transform((v) => {
    const t = typeof v === "string" ? v.trim() : "";
    return t.length >= 2 ? t : undefined;
  });

const optionalUrl = z.string().url().optional().or(z.literal("")).transform((v) => v || undefined);
const optionalUrlNullable = z
  .string()
  .url()
  .optional()
  .nullable()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

export const championshipSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  slug: optionalSlug,
  season: z.string().min(4, "Temporada obrigatória"),
  status: z.enum(["DRAFT", "REGISTRATION", "ACTIVE", "FINISHED", "CANCELLED"]).default("DRAFT"),
  description: z.string().optional(),
  logoUrl: optionalImageUrlNullable,
  bannerUrl: optionalImageUrlNullable,
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export const categorySchema = z.object({
  championshipId: z.string().min(1, "Selecione o campeonato"),
  name: z.string().min(2),
  slug: optionalSlug,
  ageGroup: z.string().optional(),
  minAge: z.coerce.number().int().optional().nullable(),
  maxAge: z.coerce.number().int().optional().nullable(),
  gender: z.string().optional(),
  imageUrl: optionalImageUrlNullable,
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const groupSchema = z.object({
  categoryId: z.string().min(1, "Selecione a categoria"),
  name: z.string().min(2),
  slug: optionalSlug,
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const staffMemberAdminSchema = z.object({
  clubId: z.string().min(1),
  name: z.string().min(2),
  role: z.enum(["HEAD_COACH", "ASSISTANT_COACH", "GOALKEEPER_COACH", "PHYSIO", "ANALYST", "MANAGER"]),
  photoUrl: optionalImageUrlNullable,
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  license: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const clubSchema = z.object({
  name: z.string().min(2),
  slug: optionalSlug,
  shortName: z.string().optional(),
  city: z.string().optional(),
  state: z.string().default("SP"),
  crestUrl: optionalImageUrlNullable,
  bannerUrl: optionalImageUrlNullable,
  foundedYear: z.coerce.number().int().optional().nullable(),
  description: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]).default("PENDING"),
});

export const athleteSchema = z.object({
  clubId: z.string().min(1, "Selecione o clube"),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  slug: optionalSlug,
  photoUrl: optionalImageUrlNullable,
  birthDate: z.string().min(1, "Data de nascimento obrigatória"),
  heightCm: z.coerce.number().int().positive().optional().nullable(),
  weightKg: z.coerce.number().positive().optional().nullable(),
  position: z.enum(["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST", "CF"]),
  shirtNumber: z.coerce.number().int().optional().nullable(),
  category: z.string().optional(),
  status: z.enum(["ACTIVE", "INJURED", "SUSPENDED", "INACTIVE", "PENDING_DOCS"]).default("ACTIVE"),
  bio: z.string().optional(),
});

const matchFields = {
  groupId: z.string().min(1),
  homeTeamId: z.string().min(1),
  awayTeamId: z.string().min(1),
  round: z.coerce.number().int().default(1),
  venue: z.string().optional(),
  status: z
    .enum(["SCHEDULED", "LIVE", "HALFTIME", "FINISHED", "POSTPONED", "CANCELLED"])
    .default("SCHEDULED"),
} as const;

/** Schema da API (POST/PATCH) — aceita scheduledAt já convertido. */
export const matchApiSchema = z.object({
  ...matchFields,
  scheduledAt: z.string().min(1, "Informe data e horário"),
});

/** Schema do formulário admin — data/hora separados, convertidos no submit. */
export const matchFormSchema = z
  .object({
    ...matchFields,
    scheduledDate: z.string().min(1, "Informe a data"),
    scheduledTime: z.string().min(1, "Informe o horário"),
  })
  .transform(({ scheduledDate, scheduledTime, ...rest }) => ({
    ...rest,
    scheduledAt: dateTimeInputsToISO(scheduledDate, scheduledTime),
  }));

/** @deprecated Use matchFormSchema no client e matchApiSchema na API */
export const matchSchema = matchFormSchema;

export const newsSchema = z.object({
  title: z.string().min(3),
  slug: optionalSlug,
  summary: z.string().optional(),
  content: z.string().min(10),
  imageUrl: optionalImageUrlNullable,
  category: z.string().optional(),
  isFeatured: z.boolean().default(false),
  publishedAt: z.string().optional().nullable(),
  championshipId: z.string().optional().nullable(),
});

const bannerLinkUrl = z
  .string()
  .optional()
  .nullable()
  .or(z.literal(""))
  .transform((v) => {
    const t = v?.trim();
    return t ? t : null;
  })
  .refine(
    (v) => !v || v.startsWith("/") || /^https?:\/\//i.test(v),
    "Link deve ser URL completa (https://...) ou caminho interno (/pagina)"
  );

export const bannerSchema = z.object({
  title: z.string().min(2),
  subtitle: z.string().optional(),
  imageUrl: requiredMediaUrl,
  linkUrl: bannerLinkUrl,
  placement: z.enum(["HERO_CAROUSEL", "SIDEBAR_LEFT", "SIDEBAR_RIGHT"]).default("HERO_CAROUSEL"),
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
});

export const sponsorSchema = z.object({
  name: z.string().min(2),
  logoUrl: optionalImageUrlNullable,
  websiteUrl: optionalUrl,
  description: z.string().optional(),
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const siteTextSchema = z.object({
  key: z.string().min(2),
  value: z.string().min(1),
  locale: z.string().default("pt-BR"),
  context: z.string().optional(),
});

export const themeConfigSchema = z.object({
  name: z.string().min(2),
  isActive: z.boolean().default(false),
  primaryColor: z.string().default("#39ff14"),
  secondaryColor: z.string().default("#00c853"),
  backgroundColor: z.string().default("#050505"),
  cardColor: z.string().default("#0f0f13"),
  textPrimary: z.string().default("#ffffff"),
  textSecondary: z.string().default("#9ca3af"),
  borderColor: z.string().default("rgba(57,255,20,0.15)"),
});

export const brandConfigSchema = z.object({
  systemName: z.string().min(2),
  slogan: z.string().optional(),
  logoUrl: optionalImageUrlNullable,
  mobileLogoUrl: optionalImageUrlNullable,
  faviconUrl: optionalImageUrlNullable,
  splashScreenUrl: optionalImageUrlNullable,
  loginBackgroundUrl: optionalImageUrlNullable,
  homeHeroBackgroundUrl: optionalImageUrlNullable,
});

export const menuItemSchema = z.object({
  label: z.string().min(2),
  href: z.string().min(1),
  icon: z.string().optional(),
  area: z.string().default("PUBLIC"),
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const documentSchema = z.object({
  clubId: z.string().optional().nullable(),
  athleteId: z.string().optional().nullable(),
  type: z.enum(["IDENTITY", "MEDICAL", "AUTHORIZATION", "REGISTRATION_FORM", "OTHER"]),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).default("PENDING"),
  fileUrl: requiredMediaUrl,
  fileName: z.string().optional(),
  expiresAt: z.string().optional().nullable(),
});

export const notificationSchema = z.object({
  userId: z.string().min(1, "Selecione o usuário"),
  type: z.enum(["MATCH", "NEWS", "REGISTRATION", "DOCUMENT", "SYSTEM"]).default("SYSTEM"),
  title: z.string().min(2, "Título obrigatório"),
  body: z.string().optional(),
  linkUrl: optionalUrlNullable,
  isRead: z.boolean().default(false),
});

export const ENTITY_SCHEMAS: Record<string, z.ZodObject<z.ZodRawShape>> = {
  championships: championshipSchema,
  categories: categorySchema,
  groups: groupSchema,
  clubs: clubSchema,
  staff_members: staffMemberAdminSchema,
  athletes: athleteSchema,
  matches: matchApiSchema,
  news: newsSchema,
  banners: bannerSchema,
  sponsors: sponsorSchema,
  site_texts: siteTextSchema,
  theme_configs: themeConfigSchema,
  brand_configs: brandConfigSchema,
  menu_items: menuItemSchema,
  documents: documentSchema,
  notifications: notificationSchema,
};
