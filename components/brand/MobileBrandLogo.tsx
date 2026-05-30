import Image from "next/image";
import Link from "next/link";
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
  const logoSrc = normalizeImageSrc(src);

  const content = (
    <span className={cn("inline-flex shrink-0 items-center justify-center", className)}>
      {logoSrc ? (
        <Image
          src={logoSrc}
          alt={systemName}
          width={56}
          height={56}
          className={cn("h-9 w-9 object-contain sm:h-10 sm:w-10", imageClassName)}
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
