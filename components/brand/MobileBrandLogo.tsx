import Image from "next/image";
import Link from "next/link";
import { normalizeImageSrc, shouldUnoptimizeImageSrc } from "@/lib/image-url";
import { cn } from "@/lib/utils";

type Props = {
  /** `null` = sem link; omitido = "/" */
  href?: string | null;
  src?: string | null;
  className?: string;
  imageClassName?: string;
  systemName?: string;
};

export function MobileBrandLogo({
  href,
  src,
  className,
  imageClassName,
  systemName = "BASEGOL",
}: Props) {
  const logoSrc = normalizeImageSrc(src);

  const content = (
    <span className={cn("inline-flex shrink-0 items-center justify-center", className)}>
      {logoSrc ? (
        <Image
          src={logoSrc}
          alt={systemName}
          width={200}
          height={56}
          className={cn(
            "h-11 w-auto max-h-11 max-w-[min(100%,168px)] object-contain object-center",
            imageClassName
          )}
          unoptimized={shouldUnoptimizeImageSrc(logoSrc)}
          priority
        />
      ) : (
        <span className="font-display text-sm tracking-wider text-neon">{systemName}</span>
      )}
    </span>
  );

  const linkHref = href === null ? null : href ?? "/";
  if (linkHref === null) return content;
  return (
    <Link href={linkHref} className="inline-flex shrink-0" aria-label="Início">
      {content}
    </Link>
  );
}
