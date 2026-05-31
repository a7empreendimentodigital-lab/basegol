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
      className={cn(
        "flex flex-col items-center rounded-xl border border-line/80 bg-graphite-light/90 p-2.5 text-center",
        "sm:flex-row sm:items-center sm:gap-3 sm:p-3 sm:text-left",
        className
      )}
    >
      <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-pitch/50 sm:h-14 sm:w-14 sm:rounded-lg">
        {photo ? (
          <SafeImage src={photo} alt="" fill className="object-cover" sizes="72px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-xl text-neon/50 sm:text-2xl">
            {displayNumber ?? "—"}
          </div>
        )}
        {displayNumber && photo ? (
          <span
            className="absolute bottom-0 right-0 min-w-[1.25rem] rounded-tl-md bg-foreground px-1 py-0.5 text-[10px] font-bold leading-none text-background tabular-nums"
            aria-hidden
          >
            {displayNumber}
          </span>
        ) : null}
      </div>

      <div className="mt-2 min-w-0 w-full sm:mt-0 sm:flex-1">
        <p className="text-[11px] font-semibold leading-snug text-foreground line-clamp-2 sm:text-sm sm:line-clamp-2">
          {name}
        </p>
        <p className="mt-1 inline-flex max-w-full rounded-md bg-pitch/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:text-xs">
          {positionLabel}
        </p>
      </div>
    </article>
  );
}
