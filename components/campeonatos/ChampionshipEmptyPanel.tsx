import type { LucideIcon } from "lucide-react";
import { publicEmptyShell } from "@/lib/public-ui-classes";
import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
};

export function ChampionshipEmptyPanel({ icon: Icon, title, description, className }: Props) {
  return (
    <div className={cn(publicEmptyShell, className)}>
      <Icon className="mb-2 h-7 w-7 text-muted-foreground/45" strokeWidth={1.25} aria-hidden />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mt-0.5 max-w-xs text-xs text-muted-foreground/90">{description}</p>
      ) : null}
    </div>
  );
}
