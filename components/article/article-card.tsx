import Link from "next/link";
import { Card } from "@/components/ui/card";
import { CategoryBadge } from "@/components/ui/category-badge";
import { cx } from "@/lib/cx";
import { formatDate } from "@/lib/format";
import type { ArticleWithRelations } from "@/lib/types";
import { ArticleCover } from "./article-cover";

/** Standard article card in the category colour (docs/design.md 3, Article card). */
export function ArticleCard({
  article,
  className,
  headingLevel: Heading = "h3",
}: {
  article: ArticleWithRelations;
  className?: string;
  headingLevel?: "h2" | "h3";
}) {
  return (
    <Card tone={article.category.slug} lift className={cx("relative flex flex-col p-3", className)}>
      <div className="flex items-center justify-between px-1 pb-3">
        <CategoryBadge name={article.category.name} />
        <span className="text-meta">{article.readingMinutes} min</span>
      </div>
      <ArticleCover article={article} className="aspect-[4/3]" />
      <div className="flex flex-1 flex-col px-1 pt-4">
        <Heading className="font-display text-xl font-extrabold leading-tight">
          {/* The stretched link makes the whole card clickable with one tab stop. */}
          <Link href={`/articles/${article.slug}`} className="after:absolute after:inset-0 after:rounded-card">
            {article.title}
          </Link>
        </Heading>
        <p className="mt-2 line-clamp-2 text-[15px] leading-snug">{article.excerpt}</p>
        <div className="mt-auto flex justify-between gap-2 border-t-2 border-current/25 pt-2 text-meta">
          <span>{article.author.name}</span>
          <time dateTime={article.publishedAt ?? undefined}>{formatDate(article.publishedAt)}</time>
        </div>
      </div>
    </Card>
  );
}
