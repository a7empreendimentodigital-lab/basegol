import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { NewsItem } from "@/types";

export function NewsCard({ news, featured }: { news: NewsItem; featured?: boolean }) {
  return (
    <Link href={`/noticias/${news.slug}`}>
      <Card
        className={`overflow-hidden hover:neon-border transition-all h-full ${
          featured ? "md:col-span-2" : ""
        }`}
      >
        {news.imageUrl && (
          <div className={featured ? "h-48 md:h-56" : "h-36"}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={news.imageUrl}
              alt={news.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <CardContent className="p-4 space-y-2">
          {news.category && (
            <span className="text-[10px] uppercase tracking-wider text-neon font-semibold">
              {news.category}
            </span>
          )}
          <h3
            className={`font-semibold leading-snug ${
              featured ? "text-lg md:text-xl" : "text-sm"
            }`}
          >
            {news.title}
          </h3>
          {news.summary && (
            <p className="text-xs text-muted-foreground line-clamp-2">{news.summary}</p>
          )}
          {news.publishedAt && (
            <p className="text-[10px] text-muted-foreground">
              {formatDate(news.publishedAt)}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
