type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  actionHref?: string;
};

export function SectionHeader({ title, actionLabel, actionHref }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-display text-2xl tracking-wide uppercase">{title}</h2>
      {actionLabel && actionHref ? (
        <a href={actionHref} className="text-xs text-neon hover:underline">
          {actionLabel}
        </a>
      ) : null}
    </div>
  );
}
