"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { parseApiResponse } from "@/lib/api-client";

type Props = {
  href?: string;
  src?: string | null;
  className?: string;
  imageClassName?: string;
};

export function MobileBrandLogo({
  href = "/",
  src,
  className,
  imageClassName,
}: Props) {
  const resolvedSrc = src ?? "/assets/favicon.webp";
  const [logoSrc, setLogoSrc] = useState(resolvedSrc);

  useEffect(() => {
    if (src) return;
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
        setLogoSrc(b?.mobileLogoUrl ?? b?.faviconUrl ?? b?.logoUrl ?? "/assets/favicon.webp");
      })
      .catch(() => setLogoSrc("/assets/favicon.webp"));
  }, [src]);

  const content = (
    <span className={cn("inline-flex shrink-0 items-center justify-center", className)}>
      <Image
        src={logoSrc}
        alt="BaseGol"
        width={56}
        height={56}
        className={cn("h-11 w-11 object-contain", imageClassName)}
        unoptimized
        priority
      />
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="inline-flex shrink-0" aria-label="Início">
      {content}
    </Link>
  );
}
