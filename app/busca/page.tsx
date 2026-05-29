import { searchPublic } from "@/services/search.service";
import Link from "next/link";
import { TeamCrest } from "@/components/matches/TeamCrest";

export const metadata = { title: "Busca" };

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query.length >= 2 ? await searchPublic(query) : [];

  return (
    <main className="p-4 md:p-6 max-w-3xl mx-auto w-full space-y-4">
        <h1 className="font-display text-3xl tracking-wide">Busca</h1>
        <form action="/busca" method="get" className="flex gap-2">
          <input
            name="q"
            defaultValue={query}
            placeholder="Campeonatos, clubes ou jogos..."
            className="flex-1 h-11 rounded-lg border border-line bg-graphite-light px-4 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-selected px-4 text-sm font-medium text-white"
          >
            Buscar
          </button>
        </form>

        {query.length < 2 ? (
          <p className="text-sm text-muted-foreground">Digite ao menos 2 caracteres.</p>
        ) : results.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum resultado para &quot;{query}&quot;.</p>
        ) : (
          <ul className="rounded-2xl border border-line bg-graphite-light divide-y divide-[#a1a1aa17]">
            {results.map((r) => (
              <li key={`${r.type}-${r.id}`}>
                <Link
                  href={r.href}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-graphite transition-colors"
                >
                  {r.imageUrl ? (
                    <TeamCrest url={r.imageUrl} name={r.title} size="sm" />
                  ) : (
                    <span className="h-8 w-8 flex items-center justify-center text-xs text-muted-foreground uppercase">
                      {r.type.slice(0, 1)}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    {r.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                    )}
                  </div>
                  <span className="text-[10px] uppercase text-muted-foreground shrink-0">
                    {r.type === "club"
                      ? "Clube"
                      : r.type === "championship"
                        ? "Campeonato"
                        : "Jogo"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
    </main>
  );
}
