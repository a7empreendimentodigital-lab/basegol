import { Award } from "lucide-react";
import { normalizeImageSrc } from "@/lib/image-url";
import { cn } from "@/lib/utils";
import { HomeSectionLink } from "@/components/home/HomeSectionLink";

export type TopScorerRow = {
  name: string;
  club: string;
  goals: number;
  photoUrl?: string | null;
};

type Props = {
  title: string;
  categoryLabel?: string;
  scorers: TopScorerRow[];
  layout?: "card" | "sidebar";
};

export function HomeTopScorersCard({
  title,
  categoryLabel,
  scorers,
  layout = "card",
}: Props) {
  const isSidebar = layout === "sidebar";

  return (
    <section
      className={cn(
        "overflow-hidden",
        isSidebar
          ? "py-4 xl:rounded-2xl xl:border xl:border-line xl:bg-graphite-light"
          : "rounded-2xl border border-line bg-graphite-light"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-2 pb-3",
          isSidebar ? "pt-0 xl:px-4 xl:pt-4" : "px-4 pt-4"
        )}
      >
        <h2 className="flex min-w-0 flex-1 items-center gap-2 text-base font-semibold text-foreground">
          <Award className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate">{title}</span>
          {categoryLabel ? (
            <span className="truncate text-xs font-normal text-muted-foreground">
              {categoryLabel}
            </span>
          ) : null}
        </h2>
        <HomeSectionLink href="/campeonatos">Ver campeonatos</HomeSectionLink>
      </div>
      <ul className="divide-y divide-[#a1a1aa17]">
        {scorers.map((s, i) => (
          <li key={`${s.name}-${i}`} className="flex items-center gap-3 px-4 py-3">
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold tabular-nums",
                i === 0 ? "bg-foreground/10 text-foreground" : "text-muted-foreground"
              )}
            >
              {i + 1}
            </span>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-graphite text-xs font-semibold text-foreground">
              {normalizeImageSrc(s.photoUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={normalizeImageSrc(s.photoUrl)!} alt="" className="h-full w-full object-cover" />
              ) : (
                s.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{s.name}</p>
              <p className="truncate text-xs text-muted-foreground">{s.club}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-lg font-bold leading-none tabular-nums text-foreground">{s.goals}</p>
              <p className="text-[10px] text-muted-foreground">gols</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
