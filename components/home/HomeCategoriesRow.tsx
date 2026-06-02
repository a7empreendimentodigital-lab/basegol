import Link from "next/link";
import { Layers } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { HomeSectionLink } from "@/components/home/HomeSectionLink";
import { normalizeImageSrc } from "@/lib/image-url";
import type { HomeCategoryCircle } from "@/services/home.service";

function CategoryCircle({
  label,
  imageUrl,
}: {
  label: string;
  imageUrl: string | null;
}) {
  const src = normalizeImageSrc(imageUrl);

  if (!src) {
    return <Layers className="h-10 w-10 shrink-0 text-neon/70" aria-hidden />;
  }

  return (
    <div className="relative h-16 w-16 shrink-0">
      <SafeImage
        src={src}
        alt={label}
        fill
        className="object-contain transition-opacity group-hover:opacity-90"
        sizes="64px"
      />
    </div>
  );
}

type CategoriesRowProps = {
  categories: HomeCategoryCircle[];
  /** Quando definido, links apontam para a página da categoria neste campeonato. */
  championshipSlug?: string;
};

export function HomeCategoriesRow({ categories, championshipSlug }: CategoriesRowProps) {
  if (categories.length === 0) return null;

  const verTodasHref = championshipSlug
    ? `/campeonatos/${championshipSlug}`
    : "/campeonatos";

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Layers className="h-4 w-4 text-muted-foreground" aria-hidden />
          Categorias
        </h2>
        <HomeSectionLink href={verTodasHref}>Ver todas</HomeSectionLink>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={
              championshipSlug
                ? `/campeonatos/${championshipSlug}/categorias/${cat.categorySlug}`
                : `/campeonatos/${cat.championshipSlug}`
            }
            className="group flex min-w-[80px] shrink-0 flex-col items-center gap-2"
          >
            <CategoryCircle label={cat.label} imageUrl={cat.imageUrl} />
            <span className="max-w-[88px] truncate text-center text-xs font-semibold leading-tight text-foreground">
              {cat.label}
            </span>
            <span className="text-[10px] text-muted-foreground">{cat.subtitle}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
