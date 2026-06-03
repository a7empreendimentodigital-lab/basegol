"use client";

import { useEffect, useState } from "react";
import { parseApiResponse } from "@/lib/api-client";
import type { ChampionshipSponsorPlacement } from "@prisma/client";
import {
  ChampionshipSponsorsRotator,
  type RotatorSponsor,
} from "@/components/public/ChampionshipSponsorsRotator";
import { cn } from "@/lib/utils";

type Props = {
  championshipSlug: string;
  placement: ChampionshipSponsorPlacement;
  variant?: "left" | "right";
  /** Se definido, exibe o rótulo só quando há patrocinadores. */
  sectionLabel?: string;
  className?: string;
};

/**
 * Área de patrocínio do campeonato: oculta totalmente se não houver cadastros ativos.
 * Rotação automática (1 por vez, 6s, fade) no componente interno.
 */
export function ChampionshipSponsorsBlock({
  championshipSlug,
  placement,
  variant = "left",
  sectionLabel = "Patrocinadores",
  className,
}: Props) {
  const [items, setItems] = useState<RotatorSponsor[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(
        `/api/public/championships/${encodeURIComponent(championshipSlug)}/sponsors?placement=${placement}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        if (!cancelled) setItems([]);
        return;
      }
      const data = await parseApiResponse<{ items: RotatorSponsor[] }>(res);
      if (!cancelled) {
        setItems(Array.isArray(data?.items) ? data.items : []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [championshipSlug, placement]);

  if (items === null || items.length === 0) {
    return null;
  }

  return (
    <div className={cn(className)}>
      {sectionLabel ? (
        <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {sectionLabel}
        </p>
      ) : null}
      <ChampionshipSponsorsRotator
        championshipSlug={championshipSlug}
        items={items}
        variant={variant}
      />
    </div>
  );
}
