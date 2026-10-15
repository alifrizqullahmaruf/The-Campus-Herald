import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryBadge } from "@/components/ui/category-badge";
import { Eyebrow } from "@/components/ui/eyebrow";
import { formatDate } from "@/lib/format";
import type { ArticleWithRelations } from "@/lib/types";
import { ArticleCover } from "./article-cover";

/** Pull the first blockquote out of the body for the feature card. */
function firstQuote(html: string): string | null {
  const match = html.match(/<blockquote><p>(.*?)<\/p><\/blockquote>/);
  return match ? match[1] : null;
}

/** Cover story: image left, text right on desktop; stacked on phone. */
export function FeatureCard({ article }: { article: ArticleWithRelations }) {
  const quote = firstQuote(article.body);
  return (
    <Card className="grid gap-6 p-4 md:grid-cols-2 md:p-6">
      <ArticleCover article={article} className="aspect-4/3" priority sizes="(min-width: 768px) 520px, 100vw" />
      <div className="flex flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <Eyebrow>Cover story</Eyebrow>
          <CategoryBadge name={article.category.name} />
        </div>
        <h3 className="mt-4 font-display text-[clamp(28px,4vw,44px)] font-black leading-none">{article.title}</h3>
        <p className="mt-3 text-ink-muted">{article.excerpt}</p>
        {quote && (
          <blockquote className="mt-4 rounded-inner border-2 border-ink bg-paper p-3 font-display text-base font-extrabold leading-snug">
            “{quote}”
          </blockquote>
        )}
        <p className="mt-4 text-meta">
          {article.author.name} · {formatDate(article.publishedAt)}
        </p>
        <div className="mt-6">
          <Button href={`/articles/${article.slug}`} variant="dark" arrow>
            Read the story
          </Button>
        </div>
      </div>
    </Card>
  );
}
