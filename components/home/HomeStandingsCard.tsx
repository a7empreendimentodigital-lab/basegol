import type { StandingRowDisplay } from "@/types";
import { cn } from "@/lib/utils";
import { TeamCrest } from "@/components/matches/TeamCrest";
import { HomeSectionLink } from "@/components/home/HomeSectionLink";
import { publicSectionBlock, publicSectionDivider } from "@/lib/public-ui-classes";

type Props = {
  title: string;
  categoryLabel?: string;
  /** Texto do link à direita (ex.: nome do grupo ou "Classificação geral"). */
  tableLinkLabel?: string;
  tableHref?: string;
  rows: StandingRowDisplay[];
  /** Na sidebar mobile: sem caixa, só linha de separação do bloco pai */
  layout?: "card" | "sidebar";
};

export function HomeStandingsCard({
  title,
  categoryLabel,
  tableLinkLabel = "Ver tabela",
  tableHref = "/tabelas",
  rows,
  layout = "card",
}: Props) {
  const isSidebar = layout === "sidebar";

  return (
    <section
      className={cn(
        "overflow-hidden",
        isSidebar ? "py-4" : cn(publicSectionBlock, publicSectionDivider)
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-2 pb-3",
          isSidebar ? "pt-0" : "px-4 pt-4"
        )}
      >
        <h2 className="flex min-w-0 flex-1 items-baseline gap-2 text-base font-semibold text-foreground">
          <span className="truncate">{title}</span>
          {categoryLabel ? (
            <span className="truncate text-xs font-normal text-muted-foreground">
              {categoryLabel}
            </span>
          ) : null}
        </h2>
        <HomeSectionLink href={tableHref}>{tableLinkLabel}</HomeSectionLink>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#a1a1aa17] text-xs text-muted-foreground">
              <th className="w-8 py-2 pl-4 pr-2 text-left font-medium">#</th>
              <th className="px-2 py-2 text-left font-medium">Clube</th>
              <th className="w-10 px-2 py-2 text-center font-medium">J</th>
              <th className="w-10 px-2 py-2 text-center font-medium">DG</th>
              <th className="w-12 py-2 pl-2 pr-4 text-center font-medium">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const dg = row.goalsFor - row.goalsAgainst;
              const dgLabel = dg > 0 ? `+${dg}` : String(dg);
              return (
                <tr
                  key={row.position}
                  className={cn(
                    "border-b border-[#a1a1aa17] last:border-0",
                    row.position === 1 && "border-l-2 border-l-foreground/40"
                  )}
                >
                  <td className="py-2.5 pl-4 pr-2">
                    <span
                      className={cn(
                        "font-semibold tabular-nums",
                        row.position <= 2 ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {row.position}
                    </span>
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <TeamCrest url={row.crestUrl} name={row.teamName} size="sm" />
                      <span className="truncate font-medium text-foreground">{row.teamName}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-center tabular-nums text-foreground">{row.played}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums text-foreground">{dgLabel}</td>
                  <td className="py-2.5 pl-2 pr-4 text-center font-bold tabular-nums text-foreground">
                    {row.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-[#a1a1aa17] py-3 text-center">
        <HomeSectionLink href="/tabela">Ver tabela completa</HomeSectionLink>
      </div>
    </section>
  );
}
