import { Award } from "lucide-react";
import { TeamCrest } from "@/components/matches/TeamCrest";
import { normalizeImageSrc } from "@/lib/image-url";
import type { TopScorer } from "@/services/statistics.service";
import { ChampionshipEmptyPanel } from "./ChampionshipEmptyPanel";

export function ChampionshipTopScorersList({ scorers }: { scorers: TopScorer[] }) {
  if (scorers.length === 0) {
    return (
      <ChampionshipEmptyPanel
        icon={Award}
        title="Sem gols registrados"
        description="Os artilheiros aparecerão aqui quando houver gols nas partidas."
      />
    );
  }

  return (
    <ul className="divide-y divide-[#a1a1aa17] overflow-hidden rounded-2xl border border-line bg-pitch/20">
      {scorers.map((s, i) => (
        <li key={s.athleteId} className="flex items-center gap-3 px-4 py-3 sm:px-5">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold tabular-nums ${
              i === 0
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground"
            }`}
          >
            {i + 1}
          </span>
          {normalizeImageSrc(s.photoUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={normalizeImageSrc(s.photoUrl)!}
              alt=""
              className="h-11 w-11 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line bg-graphite text-xs font-medium uppercase text-muted-foreground">
              {s.name.slice(0, 2)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{s.name}</p>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <TeamCrest url={s.clubCrestUrl} name={s.club} size="sm" />
              <span className="truncate">{s.club}</span>
            </div>
          </div>
          <span className="shrink-0 text-lg font-bold tabular-nums">{s.goals}</span>
        </li>
      ))}
    </ul>
  );
}
