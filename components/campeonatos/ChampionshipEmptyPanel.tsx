import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  description?: string;
};

export function ChampionshipEmptyPanel({ icon: Icon, title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-pitch/30 px-6 py-12 text-center">
      <Icon className="mb-3 h-10 w-10 text-muted-foreground/50" strokeWidth={1.25} aria-hidden />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
