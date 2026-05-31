"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type HeroBannerProps = {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function HeroBanner({
  title,
  subtitle = "Campeonato Paulista de Base — acompanhe tudo em tempo real",
  ctaLabel = "Ver jogos ao vivo",
  ctaHref = "/jogos?status=LIVE",
}: HeroBannerProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl min-h-[220px] md:min-h-[280px] bg-graphite-light/50">
      <div className="relative z-10 max-w-xl space-y-4 p-6 md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neon">
          Temporada 2026
        </p>
        <h1 className="font-display text-4xl md:text-6xl leading-none tracking-wide text-foreground">
          {title}
        </h1>
        <p className="text-foreground/80 text-sm md:text-base">{subtitle}</p>
        <Button asChild size="lg" className="mt-2">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      </div>
    </section>
  );
}
