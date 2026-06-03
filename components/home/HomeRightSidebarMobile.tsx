"use client";

import { useEffect, useRef, useState } from "react";
import { HomeRightSidebar } from "@/components/home/HomeRightSidebar";
import type { TopScorerRow } from "@/components/home/HomeTopScorersCard";
import { parseApiResponse } from "@/lib/api-client";
import type { HomeCategory } from "@/types/home";
import type { StandingRowDisplay } from "@/types";
import type { PublicBannerDto } from "@/services/banner.service";

type SidebarPayload = {
  categories: HomeCategory[];
  standingsByCategory: Record<string, StandingRowDisplay[]>;
  scorersByCategory: Record<string, TopScorerRow[]>;
};

type Props = {
  rightBanner?: PublicBannerDto | null;
  championshipSlug?: string;
};

export function HomeRightSidebarMobile({ rightBanner, championshipSlug }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<SidebarPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || fetched.current) return;

    const load = () => {
      if (fetched.current) return;
      fetched.current = true;
      setLoading(true);
      const qs = championshipSlug
        ? `?championshipSlug=${encodeURIComponent(championshipSlug)}`
        : "";
      void fetch(`/api/public/home-sidebar${qs}`)
        .then(async (res) => {
          if (!res.ok) return null;
          return parseApiResponse<SidebarPayload>(res);
        })
        .then((payload) => {
          if (payload) setData(payload);
        })
        .finally(() => setLoading(false));
    };

    if (typeof IntersectionObserver === "undefined") {
      load();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          load();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [championshipSlug]);

  return (
    <div
      ref={rootRef}
      className="border-t border-line px-3 py-6 sm:px-5 lg:px-8 xl:hidden"
    >
      {loading && !data ? (
        <div className="space-y-3 animate-pulse" aria-hidden>
          <div className="h-24 rounded-2xl bg-graphite-light/80" />
          <div className="h-40 rounded-2xl bg-graphite-light/60" />
        </div>
      ) : data ? (
        <HomeRightSidebar
          {...data}
          rightBanner={rightBanner}
          championshipSlug={championshipSlug}
          competitionsLink={championshipSlug ? "/" : "/campeonatos"}
          tableHref={
            championshipSlug
              ? `/campeonatos/${championshipSlug}/classificacao`
              : "/tabela"
          }
        />
      ) : null}
    </div>
  );
}
