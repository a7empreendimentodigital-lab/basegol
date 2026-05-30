"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { parseApiResponse } from "@/lib/api-client";
import { normalizeImageSrc, shouldUnoptimizeImageSrc } from "@/lib/image-url";
import { cn } from "@/lib/utils";

type LogoProps = {
  href?: string | null;
  src?: string | null;
  alt?: string;
  className?: string;
  imageClassName?: string;
  showWordmark?: boolean;
  wordmarkText?: string;
  size?: "sm" | "md" | "lg" | "xl" | "sidebar";
};

const sizes = {
  sm: { box: 32, w: 100, h: 32 },
  md: { box: 40, w: 120, h: 40 },
  lg: { box: 48, w: 140, h: 48 },
  xl: { box: 72, w: 180, h: 72 },
  sidebar: { box: 200, w: 280, h: 200 },
};

export function Logo({
  href = "/",
  src,
  alt = "BaseGol",
  className,
  imageClassName,
  showWordmark = false,
  wordmarkText = "BASEGOL",
  size = "md",
}: LogoProps) {
  const [dynamicLogo, setDynamicLogo] = useState<string | null>(null);
  const [dynamicSystemName, setDynamicSystemName] = useState<string | null>(null);

  useEffect(() => {
    if (src) return;
    void fetch("/api/public/config")
      .then(async (res) => {
        if (!res.ok) return null;
        return parseApiResponse<{ brand?: { logoUrl?: string | null; systemName?: string | null } | null }>(res);
      })
      .then((cfg) => {
        setDynamicLogo(normalizeImageSrc(cfg?.brand?.logoUrl));
        setDynamicSystemName(cfg?.brand?.systemName ?? null);
      });
  }, [src]);

  const s = sizes[size];
  const logoSrc = normalizeImageSrc(src) ?? dynamicLogo;
  const finalWordmark =
    wordmarkText === "BASEGOL" ? dynamicSystemName || wordmarkText : wordmarkText;

  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-2",
        size === "sidebar" && "w-full flex-col",
        className
      )}
    >
      {logoSrc ? (
        <Image
          src={logoSrc}
          alt={alt}
          width={s.w}
          height={s.h}
          className={cn(
            "h-auto w-auto object-contain",
            size === "sidebar" && "w-full max-w-[260px] max-h-[200px]",
            imageClassName
          )}
          style={size === "sidebar" ? undefined : { maxHeight: s.box }}
          priority
          unoptimized={shouldUnoptimizeImageSrc(logoSrc)}
        />
      ) : showWordmark ? (
        <span className="font-display text-2xl tracking-wider text-neon">{finalWordmark}</span>
      ) : (
        <span className="font-display text-lg tracking-wider text-foreground">{finalWordmark}</span>
      )}
      {showWordmark && logoSrc ? (
        <span className="font-display text-2xl tracking-wider text-neon">{finalWordmark}</span>
      ) : null}
    </span>
  );

  if (!href) return content;
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0",
        size === "sidebar" && "w-full justify-center"
      )}
    >
      {content}
    </Link>
  );
}
