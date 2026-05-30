import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { normalizeImageSrc } from "@/lib/image-url";
import { Badge } from "@/components/ui/badge";

type AthleteCardProps = {
  slug: string;
  name: string;
  position: string;
  clubName: string;
  photoUrl?: string | null;
  shirtNumber?: number | null;
};

export function AthleteCard({
  slug,
  name,
  position,
  clubName,
  photoUrl,
  shirtNumber,
}: AthleteCardProps) {
  return (
    <Link href={`/atletas/${slug}`}>
      <Card className="hover:neon-border transition-all overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-stretch">
            <div className="w-20 bg-secondary flex items-center justify-center shrink-0">
              {normalizeImageSrc(photoUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={normalizeImageSrc(photoUrl)!} alt={name} className="h-20 w-full object-cover" />
              ) : (
                <span className="font-display text-3xl text-neon/50">
                  {shirtNumber ?? "—"}
                </span>
              )}
            </div>
            <div className="p-3 flex flex-col justify-center min-w-0">
              <h3 className="font-semibold truncate">{name}</h3>
              <p className="text-xs text-muted-foreground truncate">{clubName}</p>
              <Badge variant="secondary" className="mt-2 w-fit text-[10px]">
                {position}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
