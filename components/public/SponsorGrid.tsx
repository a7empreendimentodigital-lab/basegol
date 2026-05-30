import { normalizeImageSrc } from "@/lib/image-url";

type SponsorGridProps = {
  sponsors: { id: string; name: string; logoUrl?: string | null; websiteUrl?: string | null }[];
};

export function SponsorGrid({ sponsors }: SponsorGridProps) {
  if (sponsors.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {sponsors.map((sponsor) => (
        <a
          key={sponsor.id}
          href={sponsor.websiteUrl ?? "#"}
          target={sponsor.websiteUrl ? "_blank" : undefined}
          rel={sponsor.websiteUrl ? "noreferrer" : undefined}
          className="glass-card p-4 neon-hover"
        >
          <div className="h-12 mb-2 flex items-center justify-center">
            {normalizeImageSrc(sponsor.logoUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={normalizeImageSrc(sponsor.logoUrl)!}
                alt={sponsor.name}
                className="max-h-10 object-contain"
              />
            ) : (
              <span className="text-sm text-neon">{sponsor.name.slice(0, 16)}</span>
            )}
          </div>
          <p className="text-xs text-center text-muted-foreground">{sponsor.name}</p>
        </a>
      ))}
    </div>
  );
}
