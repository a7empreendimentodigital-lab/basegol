import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { categoryNavPath } from "@/lib/portal-routes";
import { normalizeImageSrc } from "@/lib/image-url";

type Props = {
  championshipSlug: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  ageGroup?: string | null;
  groupCount: number;
};

export function CategoryCard({
  championshipSlug,
  name,
  slug,
  imageUrl,
  ageGroup,
  groupCount,
}: Props) {
  const img = normalizeImageSrc(imageUrl);

  return (
    <Link
      href={categoryNavPath(championshipSlug, slug)}
      className="group flex items-center gap-4 rounded-xl border border-line/60 bg-graphite/40 p-4 transition-colors hover:border-primary/40 hover:bg-graphite/60"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-pitch/60">
        {img ? (
          <SafeImage src={img} alt="" width={56} height={56} className="h-10 w-10 object-contain" />
        ) : (
          <span className="font-display text-lg text-muted-foreground">{name.slice(0, 2)}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {ageGroup ? `Faixa ${ageGroup}` : "Categoria"}
          {groupCount > 0 ? ` · ${groupCount} grupo${groupCount !== 1 ? "s" : ""}` : ""}
        </p>
      </div>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors"
        aria-hidden
      />
    </Link>
  );
}
