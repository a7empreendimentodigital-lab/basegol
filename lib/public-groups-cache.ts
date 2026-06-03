import { cache } from "react";
import {
  listPublicGroupsByCategory,
  type PublicCategoryGroups,
} from "@/services/public.service";

/** Grupos de todas as categorias ativas (legado — evitar em páginas de campeonato). */
export const getPublicGroupsByCategory = cache(
  async (): Promise<PublicCategoryGroups[]> => listPublicGroupsByCategory()
);

export const getPublicGroupsByChampionship = cache(
  async (championshipId: string): Promise<PublicCategoryGroups[]> =>
    listPublicGroupsByCategory(championshipId)
);
