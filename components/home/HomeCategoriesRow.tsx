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

  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-graphite-light transition-colors group-hover:border-foreground/30 group-hover:bg-graphite/80">
      {src ? (
        <SafeImage
          src={src}
          alt={label}
          fill
          className="object-cover"
          sizes="64px"
        />
      ) : (
        <Layers className="h-6 w-6 text-muted-foreground opacity-80" aria-hidden />
      )}
    </div>
  );
}

export function HomeCategoriesRow({ categories }: { categories: HomeCategoryCircle[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Layers className="h-4 w-4 text-muted-foreground" aria-hidden />
          Categorias
        </h2>
        <HomeSectionLink href="/campeonatos">Ver todas</HomeSectionLink>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/campeonatos/${cat.championshipSlug}`}
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
