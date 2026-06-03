import { Radio } from "lucide-react";
import type { MatchWithTeams } from "@/types";
import { LiveMatchesPoller } from "@/components/matches/LiveMatchesPoller";
import { HomeSectionLink } from "@/components/home/HomeSectionLink";

export function LiveMatchesSection({
  matches,
  verTodosHref = "/jogos?status=LIVE",
}: {
  matches: MatchWithTeams[];
  verTodosHref?: string;
}) {
  if (!matches.length) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Radio className="h-4 w-4 text-red-500" aria-hidden />
          <h2 className="font-display text-2xl uppercase tracking-wide text-foreground">
            Jogos ao vivo
          </h2>
          <span className="rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Live
          </span>
        </div>
        <HomeSectionLink href={verTodosHref}>Ver todos</HomeSectionLink>
      </div>

      <LiveMatchesPoller initialMatches={matches} />
    </section>
  );
}
