import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type Props = {
  title: string;
  description?: string;
  onNew?: () => void;
  newLabel?: string;
};

export function AdminPageHeader({ title, description, onNew, newLabel = "Novo" }: Props) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-8 pb-6 border-b border-line">
      <div className="space-y-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Administração
        </p>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>
        )}
      </div>
      {onNew && (
        <Button onClick={onNew} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          {newLabel}
        </Button>
      )}
    </div>
  );
}
