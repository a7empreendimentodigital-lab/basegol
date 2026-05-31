import type { MetadataRoute } from "next";
import { buildManifestIcons } from "@/lib/brand-icons";
import { getBrandConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const brand = await getBrandConfig();
  const name = brand?.systemName?.trim() || "BASEGOL";

  return {
    name: `${name} — Campeonato Paulista de Base`,
    short_name: name.slice(0, 12),
    description:
      "Campeonatos de base, jogos ao vivo, clubes e estatísticas",
    start_url: "/",
    display: "standalone",
    background_color: "#121212",
    theme_color: "#16C05B",
    orientation: "portrait-primary",
    icons: buildManifestIcons(brand),
    categories: ["sports", "news"],
    lang: "pt-BR",
  };
}
