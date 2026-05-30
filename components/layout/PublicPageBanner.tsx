import { SafeImage } from "@/components/ui/SafeImage";
import { normalizeImageSrc } from "@/lib/image-url";
import { PAGE_TOP_BANNER_HEIGHT_PX } from "@/lib/page-banners";

type PublicPageBannerProps = {
  src?: string | null;
  title: string;
  subtitle?: string;
};

export function PublicPageBanner({ src, title, subtitle }: PublicPageBannerProps) {
  const imageSrc = normalizeImageSrc(src);

  if (!imageSrc) {
    return (
      <section className="border-b border-line bg-graphite-light/40 px-4 py-8 md:px-6 md:py-10">
        <div className="max-w-6xl mx-auto w-full">
          <h1 className="font-display text-3xl md:text-4xl tracking-wide text-foreground">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">{subtitle}</p>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative w-full overflow-hidden border-b border-line shrink-0"
      style={{ height: PAGE_TOP_BANNER_HEIGHT_PX }}
      aria-label={title}
    >
      <SafeImage
        src={imageSrc}
        alt=""
        fill
        className="object-cover object-center"
        priority
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-pitch/92 via-pitch/65 to-pitch/35" />
      <div className="relative z-10 flex h-full flex-col justify-end px-4 pb-5 md:px-6 md:pb-6 max-w-6xl mx-auto w-full">
        <h1 className="font-display text-3xl md:text-4xl tracking-wide text-white">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-foreground/85 max-w-xl">{subtitle}</p>
        ) : null}
      </div>
    </section>
  );
}
