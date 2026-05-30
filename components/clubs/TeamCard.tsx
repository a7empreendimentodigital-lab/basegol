import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { normalizeImageSrc } from "@/lib/image-url";

type TeamCardProps = {
  slug: string;
  name: string;
  city?: string | null;
  crestUrl?: string | null;
  athleteCount?: number;
};

export function TeamCard({ slug, name, city, crestUrl, athleteCount }: TeamCardProps) {
  return (
    <Link href={`/clubes/${slug}`}>
      <Card className="hover:neon-border transition-all h-full">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary border border-border">
            {normalizeImageSrc(crestUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={normalizeImageSrc(crestUrl)!} alt={name} className="h-10 w-10 object-contain" />
            ) : (
              <span className="font-display text-xl text-neon">{name.slice(0, 2)}</span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{name}</h3>
            {city && <p className="text-xs text-muted-foreground">{city}</p>}
            {athleteCount != null && (
              <p className="text-xs text-neon mt-1">{athleteCount} atletas</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
