"use client";

import Image from "next/image";
import { motion } from "framer-motion";
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
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-line min-h-[220px] md:min-h-[280px]"
    >
      <Image
        src="/assets/bannerpricipal.webp"
        alt=""
        fill
        className="object-cover"
        priority
        sizes="(max-width: 768px) 100vw, 1200px"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-pitch/95 via-pitch/75 to-pitch/40" />
      <div className="relative z-10 max-w-xl space-y-4 p-6 md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neon">
          Temporada 2026
        </p>
        <h1 className="font-display text-4xl md:text-6xl leading-none tracking-wide text-white">
          {title}
        </h1>
        <p className="text-foreground/80 text-sm md:text-base">{subtitle}</p>
        <Button asChild size="lg" className="mt-2">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      </div>
    </motion.section>
  );
}
