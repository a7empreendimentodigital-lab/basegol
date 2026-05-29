import { getNewsBySlug } from "@/services/news.service";
import { formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);
  if (!article) notFound();

  const content = "content" in article ? (article as { content?: string }).content : null;

  return (
    <article className="p-4 md:p-6 max-w-3xl mx-auto w-full space-y-4">
        {"imageUrl" in article && article.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.imageUrl} alt={article.title} className="w-full rounded-xl object-cover max-h-80" />
        )}
        {"category" in article && article.category && (
          <span className="text-xs uppercase tracking-wider text-neon">{article.category}</span>
        )}
        <h1 className="font-display text-4xl tracking-wide leading-tight">{article.title}</h1>
        {"publishedAt" in article && article.publishedAt && (
          <p className="text-sm text-muted-foreground">{formatDate(article.publishedAt)}</p>
        )}
        {"summary" in article && article.summary && (
          <p className="text-lg text-muted-foreground">{article.summary}</p>
        )}
        <div className="prose prose-invert max-w-none text-sm leading-relaxed">
          {content ?? (
            <p>
              Conteúdo completo da notícia. Após configurar o banco MySQL e executar o seed,
              as notícias virão do Prisma com conteúdo real.
            </p>
          )}
        </div>
    </article>
  );
}
