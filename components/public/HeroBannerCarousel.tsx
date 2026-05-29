"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { bannerLinkProps } from "@/lib/banner-link";
import type { PublicBannerDto } from "@/services/banner.service";

type HeroBannerCarouselProps = {
  slides: PublicBannerDto[];
  fallbackTitle?: string;
  fallbackSubtitle?: string;
  fallbackBackgroundUrl?: string | null;
};

const ROTATE_MS = 6000;
const HERO_HEIGHT_CLASS = "h-[390px]";

export function HeroBannerCarousel({
  slides,
  fallbackTitle,
  fallbackSubtitle,
  fallbackBackgroundUrl,
}: HeroBannerCarouselProps) {
  const [index, setIndex] = useState(0);
  const count = slides.length;

  const next = useCallback(() => {
    if (count <= 1) return;
    setIndex((i) => (i + 1) % count);
  }, [count]);

  const prev = useCallback(() => {
    if (count <= 1) return;
    setIndex((i) => (i - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    if (count <= 1) return;
    const id = window.setInterval(next, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [count, next]);

  if (count === 0) {
    const bg = fallbackBackgroundUrl || "/assets/bannerpricipal.webp";
    return (
      <section
        className={cn(
          "relative overflow-hidden rounded-2xl border border-line",
          HERO_HEIGHT_CLASS
        )}
      >
        <Image src={bg} alt="" fill className="object-cover" priority sizes="(max-width: 1280px) 100vw, 1200px" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center h-full p-6 sm:p-8 lg:p-10 max-w-xl">
          {fallbackTitle ? (
            <h1 className="font-display text-[66px] leading-[0.95] tracking-wide uppercase text-white">
              {fallbackTitle}
            </h1>
          ) : null}
          {fallbackSubtitle ? (
            <p className="mt-2 text-[16px] leading-snug text-white/85">{fallbackSubtitle}</p>
          ) : null}
          <Link
            href="/campeonatos"
            className="mt-5 inline-flex w-fit items-center gap-1 rounded-lg bg-selected px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Conheça as ligas
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    );
  }

  const slide = slides[index];
  const link = bannerLinkProps(slide.linkUrl);

  const slideContent = (
    <>
      <Image
        src={slide.imageUrl}
        alt={slide.title}
        fill
        className="object-cover"
        priority={index === 0}
        sizes="(max-width: 1280px) 100vw, 1200px"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/20" />
      {(slide.title || slide.subtitle) && (
        <div className="relative z-10 flex flex-col justify-center h-full p-6 sm:p-8 lg:p-10 max-w-xl pointer-events-none">
          {slide.title ? (
            <h2 className="font-display text-[66px] leading-[0.95] tracking-wide uppercase text-white drop-shadow-md">
              {slide.title}
            </h2>
          ) : null}
          {slide.subtitle ? (
            <p className="mt-2 text-[16px] leading-snug text-white/85 drop-shadow">{slide.subtitle}</p>
          ) : null}
        </div>
      )}
    </>
  );

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-line group",
        HERO_HEIGHT_CLASS
      )}
    >
      {link.href ? (
        <a
          {...link}
          className="absolute inset-0 block focus:outline-none focus-visible:ring-2 focus-visible:ring-selected"
          aria-label={slide.title}
        >
          {slideContent}
        </a>
      ) : (
        <div className="absolute inset-0">{slideContent}</div>
      )}

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-black/70"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-black/70"
            aria-label="Próximo slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === index ? "w-6 bg-selected" : "w-2 bg-white/50 hover:bg-white/80"
                )}
                aria-label={`Ir para slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
