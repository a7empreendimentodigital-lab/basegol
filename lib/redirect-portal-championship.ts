import { redirect } from "next/navigation";
import { championshipScopedPath } from "@/lib/portal-championship-slug";
import { getServerPortalChampionshipSlug } from "@/lib/portal-championship-context.server";

type Segment = "jogos" | "classificacao" | "clubes";

export async function redirectGlobalRouteToPortalChampionship(
  segment: Segment,
  searchParams: Record<string, string | undefined>
) {
  const slug = await getServerPortalChampionshipSlug();
  if (!slug) return null;

  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value != null && value !== "") qs.set(key, value);
  }
  const search = qs.toString() ? `?${qs.toString()}` : "";
  redirect(championshipScopedPath(slug, segment, search));
}
