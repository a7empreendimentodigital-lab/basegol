import { z } from "zod";
import { DEFAULT_PAGE_SIZE } from "@/utils/pagination";

export const adminListQuerySchema = z.object({
  q: z
    .string()
    .optional()
    .transform((s) => {
      const trimmed = s?.trim();
      return trimmed ? trimmed : undefined;
    }),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(DEFAULT_PAGE_SIZE),
  categoryId: z
    .string()
    .optional()
    .transform((s) => {
      const trimmed = s?.trim();
      return trimmed ? trimmed : undefined;
    }),
});

export const adminCrudPayloadSchema = z.record(z.unknown());

export const impersonationSchema = z.object({
  targetUserId: z.string().cuid(),
});
