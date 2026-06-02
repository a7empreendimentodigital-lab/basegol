import { cache } from "react";
import {
  listPublicGroupsByCategory,
  type PublicCategoryGroups,
} from "@/services/public.service";

/** Uma consulta por request (layout + página /clubes). */
export const getPublicGroupsByCategory = cache(
  async (): Promise<PublicCategoryGroups[]> => listPublicGroupsByCategory()
);
