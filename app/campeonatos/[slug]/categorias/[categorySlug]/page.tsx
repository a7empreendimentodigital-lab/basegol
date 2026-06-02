import { CategoryPortalView } from "@/components/portal/CategoryPortalView";
import { getCategoryPortalDetail } from "@/services/championship-portal.service";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ slug: string; categorySlug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, categorySlug } = await params;
  const data = await getCategoryPortalDetail(slug, categorySlug);
  if (!data) return { title: "Categoria" };
  return { title: `${data.category.name} — ${data.championship.name}` };
}

export default async function CategoryPortalPage({ params }: PageProps) {
  const { slug, categorySlug } = await params;
  const data = await getCategoryPortalDetail(slug, categorySlug);
  if (!data) notFound();

  return <CategoryPortalView data={data} />;
}
