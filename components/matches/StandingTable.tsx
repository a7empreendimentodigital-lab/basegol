import type { StandingRowDisplay } from "@/types";
import { TeamCrest } from "@/components/matches/TeamCrest";

export function StandingTable({ rows }: { rows: StandingRowDisplay[] }) {
  return (
    <div className="overflow-x-auto border-t border-line/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#a1a1aa17] text-muted-foreground text-xs uppercase tracking-wider">
            <th className="p-3 text-left w-8">#</th>
            <th className="p-3 text-left">Clube</th>
            <th className="p-2 text-center">J</th>
            <th className="p-2 text-center hidden sm:table-cell">V</th>
            <th className="p-2 text-center hidden sm:table-cell">E</th>
            <th className="p-2 text-center hidden sm:table-cell">D</th>
            <th className="p-2 text-center hidden md:table-cell">SG</th>
            <th className="p-3 text-center font-semibold text-foreground">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.position}
              className="border-b border-[#a1a1aa17] last:border-0 hover:bg-graphite/60 transition-colors"
            >
              <td className="p-3 font-mono text-muted-foreground tabular-nums">{row.position}</td>
              <td className="p-3">
                <div className="flex items-center gap-2 min-w-0">
                  <TeamCrest url={row.crestUrl} name={row.teamName} size="sm" />
                  <span className="font-medium truncate">{row.teamName}</span>
                </div>
              </td>
              <td className="p-2 text-center">{row.played}</td>
              <td className="p-2 text-center hidden sm:table-cell">{row.won}</td>
              <td className="p-2 text-center hidden sm:table-cell">{row.drawn}</td>
              <td className="p-2 text-center hidden sm:table-cell">{row.lost}</td>
              <td className="p-2 text-center hidden md:table-cell">
                {row.goalsFor - row.goalsAgainst}
              </td>
              <td className="p-3 text-center font-bold tabular-nums">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
