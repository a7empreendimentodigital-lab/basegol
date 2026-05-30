import Link from "next/link";
import Image from "next/image";
import { STATIC_ASSETS } from "@/lib/image-url";
import { Layers } from "lucide-react";
import type { HomeCategoryCircle } from "@/services/home.service";
import { HomeSectionLink } from "@/components/home/HomeSectionLink";

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
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-line bg-graphite-light transition-colors group-hover:border-foreground/30 group-hover:bg-graphite/80">
              <Image src={STATIC_ASSETS.bola} alt="" width={32} height={32} className="opacity-90" unoptimized />
            </div>
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
