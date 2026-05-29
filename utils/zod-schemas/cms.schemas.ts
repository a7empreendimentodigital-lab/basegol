import { z } from "zod";

export const themeConfigSchema = z.object({
  name: z.string().min(2).max(80),
  isActive: z.boolean().default(true),
  primaryColor: z.string().min(4),
  secondaryColor: z.string().min(4),
  backgroundColor: z.string().min(4),
  cardColor: z.string().min(4),
  textPrimary: z.string().min(4),
  textSecondary: z.string().min(4),
  borderColor: z.string().min(4),
});

export const brandConfigSchema = z.object({
  systemName: z.string().min(2).max(80),
  slogan: z.string().max(180).optional(),
  logoUrl: z.string().url().optional(),
  faviconUrl: z.string().url().optional(),
  splashScreenUrl: z.string().url().optional(),
  loginBackgroundUrl: z.string().url().optional(),
  homeHeroBackgroundUrl: z.string().url().optional(),
});

export const sponsorSchema = z.object({
  name: z.string().min(2).max(100),
  logoUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  description: z.string().max(240).optional(),
  order: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const systemSettingUpsertSchema = z.object({
  key: z.string().min(2),
  value: z.unknown(),
});
