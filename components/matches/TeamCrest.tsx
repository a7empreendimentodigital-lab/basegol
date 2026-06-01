"use client";

import { useState } from "react";
import { normalizeImageSrc } from "@/lib/image-url";
import { cn } from "@/lib/utils";

type Props = {
  url: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl" | "match";
};

const sizeMap = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-11 w-11 text-xs",
  lg: "h-14 w-14 text-sm",
  match: "h-[4.75rem] w-[4.75rem] text-sm",
  xl: "h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] text-sm",
};

export function TeamCrest({ url, name, size = "md" }: Props) {
  const [imgError, setImgError] = useState(false);
  const initials = name.slice(0, 2).toUpperCase();
  const src = normalizeImageSrc(url);
  const showImg = Boolean(src) && !imgError;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center font-semibold text-muted-foreground",
        sizeMap[size]
      )}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src!}
          alt={name}
          className="h-full w-full object-contain"
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
