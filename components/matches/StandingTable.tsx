import type { StandingRowDisplay } from "@/types";
import { TeamCrest } from "@/components/matches/TeamCrest";

const STANDING_LEGEND = [
  { abbr: "J", label: "Jogos" },
  { abbr: "V", label: "Vitórias" },
  { abbr: "E", label: "Empates" },
  { abbr: "D", label: "Derrotas" },
  { abbr: "SG", label: "Saldo de gols" },
  { abbr: "Pts", label: "Pontos" },
] as const;

const thCompact =
  "p-1.5 text-center text-[10px] font-medium uppercase tracking-wide sm:p-2 sm:text-xs";

export function StandingTable({ rows }: { rows: StandingRowDisplay[] }) {
  return (
    <div className="border-t border-line/60">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] text-sm">
          <thead>
            <tr className="border-b border-[#a1a1aa17] text-muted-foreground">
              <th className="w-7 p-2 text-left text-[10px] uppercase sm:w-8 sm:p-3 sm:text-xs">
                #
              </th>
              <th className="p-2 text-left text-[10px] uppercase sm:p-3 sm:text-xs">Clube</th>
              <th className={thCompact}>J</th>
              <th className={thCompact}>V</th>
              <th className={thCompact}>E</th>
              <th className={thCompact}>D</th>
              <th className={thCompact}>SG</th>
              <th className="p-1.5 text-center text-[10px] font-semibold uppercase text-foreground sm:p-3 sm:text-xs">
                Pts
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.position}-${row.teamName}`}
                className="border-b border-[#a1a1aa17] last:border-0 hover:bg-graphite/60 transition-colors"
              >
                <td className="p-2 font-mono text-[11px] text-muted-foreground tabular-nums sm:p-3 sm:text-sm">
                  {row.position}
                </td>
                <td className="max-w-[7rem] p-2 sm:max-w-none sm:p-3">
                  <div className="flex items-center gap-1.5 min-w-0 sm:gap-2">
                    <TeamCrest url={row.crestUrl} name={row.teamName} size="sm" />
                    <span className="truncate text-xs font-medium sm:text-sm">{row.teamName}</span>
                  </div>
                </td>
                <td className="p-1.5 text-center text-xs tabular-nums sm:p-2 sm:text-sm">
                  {row.played}
                </td>
                <td className="p-1.5 text-center text-xs tabular-nums sm:p-2 sm:text-sm">
                  {row.won}
                </td>
                <td className="p-1.5 text-center text-xs tabular-nums sm:p-2 sm:text-sm">
                  {row.drawn}
                </td>
                <td className="p-1.5 text-center text-xs tabular-nums sm:p-2 sm:text-sm">
                  {row.lost}
                </td>
                <td className="p-1.5 text-center text-xs tabular-nums sm:p-2 sm:text-sm">
                  {row.goalsFor - row.goalsAgainst}
                </td>
                <td className="p-1.5 text-center text-xs font-bold tabular-nums sm:p-3 sm:text-sm">
                  {row.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-line/40 px-3 py-2.5 sm:px-4">
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">
          Legenda
        </p>
        <dl className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground sm:text-xs">
          {STANDING_LEGEND.map((item) => (
            <div key={item.abbr} className="flex gap-1">
              <dt className="font-semibold text-foreground/90">{item.abbr}</dt>
              <dd>{item.label}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-[10px] leading-snug text-muted-foreground/90 sm:text-[11px]">
          Pontuação: vitória no jogo = 3 pts · empate = 1 pt · vencedor nos pênaltis = +1 pt
          (independente do placar do jogo).
        </p>
      </div>
    </div>
  );
}
