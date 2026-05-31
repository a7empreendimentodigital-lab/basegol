import Link from "next/link";
import { TeamCrest } from "@/components/matches/TeamCrest";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  name: string;
  city?: string | null;
  crestUrl?: string | null;
  className?: string;
};

export function ClubCrestCard({ slug, name, city, crestUrl, className }: Props) {
  return (
    <Link
      href={`/clubes/${slug}`}
      className={cn(
        "group flex flex-col items-center gap-2 p-3 transition-colors",
        "hover:bg-graphite/50",
        className
      )}
    >
      <TeamCrest url={crestUrl ?? null} name={name} size="lg" />
      <div className="min-w-0 w-full text-center">
        <p className="text-sm font-semibold leading-snug text-foreground line-clamp-2 group-hover:underline">
          {name}
        </p>
        {city ? <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{city}</p> : null}
      </div>
    </Link>
  );
}
