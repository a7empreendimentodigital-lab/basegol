import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { Logo } from "@/components/brand/Logo";
import { isPaulistaPremiumChampionship } from "@/lib/portal-routes";
import { normalizeImageSrc } from "@/lib/image-url";
import { cn } from "@/lib/utils";
import { PORTAL_INSTITUTIONAL_NAV } from "@/lib/portal-routes";

type Props = {
  name: string;
  slug: string;
  season: string;
  logoUrl: string | null;
  bannerUrl?: string | null;
  description?: string | null;
};

export function ChampionshipPortalHeader({
  name,
  slug,
  season,
  logoUrl,
  bannerUrl,
  description,
}: Props) {
  const premium = isPaulistaPremiumChampionship(slug, name);
  const logoSrc = normalizeImageSrc(logoUrl);
  const bannerSrc = normalizeImageSrc(bannerUrl);

  return (
    <div
      className={cn(
        "relative overflow-hidden border-b border-line/50",
        premium
          ? "bg-gradient-to-br from-pitch via-graphite to-pitch"
          : "bg-graphite/30"
      )}
    >
      {bannerSrc ? (
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${bannerSrc})` }}
          aria-hidden
        />
      ) : null}
      {premium ? (
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.15),transparent_60%)]"
          aria-hidden
        />
      ) : null}

      <div className="relative mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/30 pb-4">
          <Logo href="/" size="sm" showWordmark />
          <nav className="flex gap-5 text-sm">
            {PORTAL_INSTITUTIONAL_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:text-left">
          <div
            className={cn(
              "flex shrink-0 items-center justify-center",
              premium ? "h-28 w-28" : "h-20 w-20"
            )}
          >
            {logoSrc ? (
              <SafeImage
                src={logoSrc}
                alt=""
                width={112}
                height={112}
                className="h-full w-full object-contain drop-shadow-lg"
              />
            ) : (
              <span className="font-display text-3xl text-muted-foreground">
                {name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-widest text-primary/90">
              Temporada {season}
            </p>
            <h1
              className={cn(
                "mt-1 font-display tracking-wide text-foreground",
                premium ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
              )}
            >
              {name}
            </h1>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
