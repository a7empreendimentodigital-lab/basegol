import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PLAYER_POSITION_LABELS } from "@/lib/admin-labels";
import { normalizeImageSrc } from "@/lib/image-url";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  name: string;
  position: string;
  photoUrl?: string | null;
  shirtNumber?: number | null;
  className?: string;
};

export function SquadAthleteCard({
  slug,
  name,
  position,
  photoUrl,
  shirtNumber,
  className,
}: Props) {
  const positionLabel = PLAYER_POSITION_LABELS[position] ?? position;

  return (
    <Link
      href={`/atletas/${slug}`}
      className={cn(
        "group flex items-center gap-3 rounded-xl border border-line bg-pitch/40 p-3 transition-colors",
        "hover:border-foreground/30 hover:bg-graphite-light",
        className
      )}
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
        {normalizeImageSrc(photoUrl) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={normalizeImageSrc(photoUrl)!} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-2xl text-neon/40">
            {shirtNumber ?? "—"}
          </div>
        )}
        {shirtNumber != null && photoUrl ? (
          <span className="absolute bottom-0 right-0 rounded-tl-md bg-foreground px-1.5 py-0.5 text-[10px] font-bold text-background">
            {shirtNumber}
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-neon transition-colors">
          {name}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{positionLabel}</p>
      </div>

      <ChevronRight
        className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
    </Link>
  );
}
