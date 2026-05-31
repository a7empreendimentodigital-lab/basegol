"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
};

export function AdminListRowActions({ onEdit, onDelete, editLabel = "Editar", deleteLabel = "Excluir" }: Props) {
  return (
    <div className="flex shrink-0 gap-0.5 sm:justify-self-end">
      <Button type="button" variant="ghost" size="sm" onClick={onEdit} aria-label={editLabel}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onDelete} aria-label={deleteLabel}>
        <Trash2 className="h-4 w-4 text-red-400" />
      </Button>
    </div>
  );
}
