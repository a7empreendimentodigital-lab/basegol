"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { parseApiResponse } from "@/lib/api-client";
import { normalizeImageSrc, shouldUnoptimizeImageSrc } from "@/lib/image-url";
import { cn } from "@/lib/utils";

type Props = {
  href?: string;
  src?: string | null;
  className?: string;
  imageClassName?: string;
  systemName?: string;
};

export function MobileBrandLogo({
  href = "/",
  src,
  className,
  imageClassName,
  systemName = "BASEGOL",
}: Props) {
  const [logoSrc, setLogoSrc] = useState<string | null>(normalizeImageSrc(src));

  useEffect(() => {
    if (src) {
      setLogoSrc(normalizeImageSrc(src));
      return;
    }
    void fetch("/api/public/config")
      .then(async (res) => {
        if (!res.ok) return null;
        return parseApiResponse<{
          brand?: {
            mobileLogoUrl?: string | null;
            faviconUrl?: string | null;
            logoUrl?: string | null;
          } | null;
        }>(res);
      })
      .then((cfg) => {
        const b = cfg?.brand;
        setLogoSrc(
          normalizeImageSrc(b?.mobileLogoUrl) ??
            normalizeImageSrc(b?.faviconUrl) ??
            normalizeImageSrc(b?.logoUrl)
        );
      })
      .catch(() => setLogoSrc(null));
  }, [src]);

  const content = (
    <span className={cn("inline-flex shrink-0 items-center justify-center", className)}>
      {logoSrc ? (
        <Image
          src={logoSrc}
          alt={systemName}
          width={56}
          height={56}
          className={cn("h-11 w-11 object-contain", imageClassName)}
          unoptimized={shouldUnoptimizeImageSrc(logoSrc)}
          priority
        />
      ) : (
        <span className="font-display text-sm tracking-wider text-neon">{systemName}</span>
      )}
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="inline-flex shrink-0" aria-label="Início">
      {content}
    </Link>
  );
}
