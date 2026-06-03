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
          <Radio className="h-5 w-5 text-red-400" aria-hidden />
          <h2 className="font-display text-2xl uppercase tracking-wide text-foreground">
            Jogos ao vivo
          </h2>
          <span className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
            Live
          </span>
        </div>
        <HomeSectionLink href={verTodosHref}>Ver todos</HomeSectionLink>
      </div>

      <LiveMatchesPoller initialMatches={matches} />
    </section>
  );
}
