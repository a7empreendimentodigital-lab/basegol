"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { parseApiResponse } from "@/lib/api-client";
import { normalizeImageSrc } from "@/lib/image-url";
import type { ChampionshipSponsorPlacement } from "@prisma/client";

type SponsorItem = {
  id: string;
  name: string;
  logoUrl: string | null;
  linkUrl: string | null;
};

type Props = {
  championshipSlug: string;
  placement: ChampionshipSponsorPlacement;
  variant?: "left" | "right";
};

export function ChampionshipSponsorsBlock({
  championshipSlug,
  placement,
  variant = "left",
}: Props) {
  const [items, setItems] = useState<SponsorItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(
        `/api/public/championships/${encodeURIComponent(championshipSlug)}/sponsors?placement=${placement}`,
        { cache: "no-store" }
      );
      if (!res.ok || cancelled) return;
      const data = await parseApiResponse<{ items: SponsorItem[] }>(res);
      if (!cancelled && Array.isArray(data?.items)) {
        setItems(data.items);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [championshipSlug, placement]);

  if (!items.length) return null;

  return (
    <div className="space-y-2">
      {items.map((s) => {
        const src = normalizeImageSrc(s.logoUrl);
        const inner = src ? (
          <SafeImage
            src={src}
            alt={s.name}
            width={200}
            height={80}
            className={
              variant === "left"
                ? "h-auto max-h-20 w-full object-contain"
                : "h-auto max-h-16 w-full object-contain"
            }
          />
        ) : (
          <span className="text-xs font-medium text-muted-foreground">{s.name}</span>
        );

        if (s.linkUrl) {
          return (
            <Link
              key={s.id}
              href={s.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-[#a1a1aa1f] bg-graphite/30 p-2 transition-opacity hover:opacity-90"
            >
              {inner}
            </Link>
          );
        }

        return (
          <div
            key={s.id}
            className="rounded-lg border border-[#a1a1aa1f] bg-graphite/30 p-2"
          >
            {inner}
          </div>
        );
      })}
    </div>
  );
}
