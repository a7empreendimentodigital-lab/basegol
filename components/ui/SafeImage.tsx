"use client";

import Image, { type ImageProps } from "next/image";
import { normalizeImageSrc, shouldUnoptimizeImageSrc } from "@/lib/image-url";

export type SafeImageProps = Omit<ImageProps, "src"> & {
  src: string | null | undefined;
};

export function SafeImage({ src, unoptimized, alt = "", ...rest }: SafeImageProps) {
  const normalized = normalizeImageSrc(src);
  if (!normalized) return null;

  return (
    <Image
      {...rest}
      alt={alt}
      src={normalized}
      unoptimized={unoptimized ?? shouldUnoptimizeImageSrc(normalized)}
    />
  );
}
