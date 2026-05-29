import { NewsCard } from "@/components/news/NewsCard";
import { getFeaturedNews } from "@/services/news.service";

export const metadata = { title: "Notícias" };

export default async function NoticiasPage() {
  const news = await getFeaturedNews();

  return (
    <main className="p-4 md:p-6 max-w-6xl mx-auto w-full">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {news.map((n) => (
            <NewsCard key={n.id} news={n} featured={n.isFeatured} />
          ))}
        </div>
    </main>
  );
}
