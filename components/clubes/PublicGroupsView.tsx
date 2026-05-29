import Link from "next/link";
import { Layers } from "lucide-react";
import { TeamCrest } from "@/components/matches/TeamCrest";
import type { PublicCategoryGroups } from "@/services/public.service";

type Props = {
  categories: PublicCategoryGroups[];
};

export function PublicGroupsView({ categories }: Props) {
  if (categories.length === 0) {
    return (
      <p className="rounded-2xl border border-line bg-graphite-light py-10 text-center text-sm text-muted-foreground">
        Nenhum grupo cadastrado nas categorias ativas.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {categories.map((cat) => (
        <section key={cat.id} className="rounded-2xl border border-line bg-graphite-light/90 overflow-hidden">
          <header className="border-b border-line bg-pitch/40 px-4 py-3 sm:px-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {cat.championshipName} · {cat.season}
            </p>
            <h2 className="mt-0.5 font-display text-xl tracking-wide text-foreground">{cat.name}</h2>
          </header>

          <div className="divide-y divide-line/40">
            {cat.groups.map((group) => (
              <div key={group.id} className="px-4 py-4 sm:px-5">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Layers className="h-4 w-4 text-muted-foreground" aria-hidden />
                  {group.name}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({group.teams.length} clubes)
                  </span>
                </p>
                {group.teams.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum clube inscrito neste grupo.</p>
                ) : (
                  <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                    {group.teams.map((team) => (
                      <li key={team.id}>
                        <Link
                          href={`/clubes/${team.slug}`}
                          className="flex flex-col items-center gap-1.5 rounded-xl border border-transparent p-2 transition-colors hover:border-line hover:bg-graphite/50"
                        >
                          <TeamCrest url={team.crestUrl} name={team.name} size="md" />
                          <span className="max-w-full truncate text-center text-[11px] font-medium text-foreground">
                            {team.name}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
