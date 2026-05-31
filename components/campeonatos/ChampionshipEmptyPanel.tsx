import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  description?: string;
};

export function ChampionshipEmptyPanel({ icon: Icon, title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-pitch/30 px-4 py-8 text-center sm:px-5">
      <Icon className="mb-2 h-7 w-7 text-muted-foreground/45" strokeWidth={1.25} aria-hidden />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mt-0.5 max-w-xs text-xs text-muted-foreground/90">{description}</p>
      ) : null}
    </div>
  );
}
