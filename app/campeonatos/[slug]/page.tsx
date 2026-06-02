import { CategoryCard } from "@/components/portal/CategoryCard";
import {
  getChampionshipCategoriesForPortal,
  getChampionshipPortalBase,
} from "@/services/championship-portal.service";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const ch = await getChampionshipPortalBase(slug);
  if (!ch) return { title: "Campeonato" };
  return { title: `${ch.name} — BaseGol` };
}

export default async function ChampionshipHomePage({ params }: PageProps) {
  const { slug } = await params;
  const championship = await getChampionshipPortalBase(slug);
  if (!championship) notFound();

  const categories = await getChampionshipCategoriesForPortal(championship.id);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6">
        <h2 className="font-display text-xl tracking-wide text-foreground sm:text-2xl">
          Escolha uma categoria
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Jogos, classificação e clubes são exibidos por categoria.
        </p>
      </div>

      {categories.length === 0 ? (
        <p className="rounded-xl border border-line/60 bg-graphite/30 px-6 py-12 text-center text-sm text-muted-foreground">
          Nenhuma categoria publicada para este campeonato.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              championshipSlug={slug}
              name={cat.name}
              slug={cat.slug}
              imageUrl={cat.imageUrl}
              ageGroup={cat.ageGroup}
              groupCount={cat._count.groups}
            />
          ))}
        </div>
      )}
    </main>
  );
}
