type DataTableProps = {
  columns: string[];
  rows: Array<Record<string, unknown>>;
};

export function DataTable({ columns, rows }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-secondary/40">
            {columns.map((column) => (
              <th key={column} className="text-left p-3 text-xs text-muted-foreground uppercase">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-t border-border/60">
              {columns.map((column) => (
                <td key={`${idx}-${column}`} className="p-3">
                  {String(row[column] ?? "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
