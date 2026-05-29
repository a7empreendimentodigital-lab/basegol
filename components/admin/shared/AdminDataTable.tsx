"use client";

import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export type AdminColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
};

type Props<T extends { id: string }> = {
  columns: AdminColumn<T>[];
  data: T[];
  loading?: boolean;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  emptyMessage?: string;
};

export function AdminDataTable<T extends { id: string }>({
  columns,
  data,
  loading,
  onEdit,
  onDelete,
  emptyMessage = "Nenhum registro encontrado.",
}: Props<T>) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-sm text-muted-foreground">{emptyMessage}</div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Ações</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 ${col.className ?? ""}`}>
                    {col.cell(row)}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {onEdit && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(row)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(row)}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Thumb({ src, alt }: { src?: string | null; alt?: string }) {
  if (!src) {
    return <div className="h-10 w-10 rounded-lg bg-secondary border border-border" />;
  }
  return (
    <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-border bg-secondary">
      <Image src={src} alt={alt ?? ""} fill className="object-cover" unoptimized />
    </div>
  );
}
