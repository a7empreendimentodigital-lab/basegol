import { SafeImage } from "@/components/ui/SafeImage";
import { PLAYER_POSITION_LABELS } from "@/lib/admin-labels";
import { normalizeImageSrc } from "@/lib/image-url";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  position: string;
  photoUrl?: string | null;
  shirtNumber?: number | null;
  className?: string;
};

export function SquadAthleteCard({
  name,
  position,
  photoUrl,
  shirtNumber,
  className,
}: Props) {
  const positionLabel = PLAYER_POSITION_LABELS[position] ?? position;
  const photo = normalizeImageSrc(photoUrl);
  const displayNumber = shirtNumber != null ? String(shirtNumber) : null;

  return (
    <article
      className={cn("flex flex-col items-center p-3 text-center", className)}
    >
      <div className="relative h-[9.5rem] w-[8.5rem] shrink-0 overflow-hidden rounded-xl bg-pitch/50">
        {photo ? (
          <SafeImage src={photo} alt="" fill className="object-cover" sizes="(max-width: 640px) 136px, 160px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-3xl text-neon/50">
            {displayNumber ?? "—"}
          </div>
        )}
        {displayNumber && photo ? (
          <span
            className="absolute bottom-0 right-0 min-w-[1.625rem] rounded-tl-lg bg-foreground px-1.5 py-1 text-xs font-bold leading-none text-background tabular-nums"
            aria-hidden
          >
            {displayNumber}
          </span>
        ) : null}
      </div>

      <div className="mt-2.5 min-w-0 w-full">
        <p className="text-xs font-semibold leading-snug text-foreground line-clamp-2 sm:text-sm">
          {name}
        </p>
        <p className="mt-1 inline-flex max-w-full rounded-md bg-pitch/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:text-xs">
          {positionLabel}
        </p>
      </div>
    </article>
  );
}
