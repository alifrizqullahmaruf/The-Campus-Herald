import Link from "next/link";
import { CategoryBadge } from "@/components/ui/category-badge";
import { cx } from "@/lib/cx";
import { formatCount } from "@/lib/format";
import type { ArticleWithRelations } from "@/lib/types";
import { CoverArt } from "./cover-art";

/** Compact row for Most read and search results. */
export function ArticleRow({
  article,
  rank,
  showViews,
  className,
}: {
  article: ArticleWithRelations;
  /** 1-based position; shown as a large outlined number. */
  rank?: number;
  showViews?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "group relative flex items-center gap-3 rounded-inner border-3 border-ink bg-surface p-2 pr-3",
        "transition-[translate,box-shadow] duration-150 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard",
        "focus-within:shadow-hard",
        className,
      )}
    >
      <div className="size-12 shrink-0 overflow-hidden rounded-md border-2 border-ink">
        <CoverArt seed={article.id} category={article.category.slug} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[15px] font-extrabold leading-tight">
          <Link href={`/articles/${article.slug}`} className="after:absolute after:inset-0">
            {article.title}
          </Link>
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-meta text-ink-muted">
          <CategoryBadge name={article.category.name} className="text-[10px]!" />
          {showViews ? `${formatCount(article.viewCount)} reads` : `${article.readingMinutes} min`}
        </p>
      </div>
      {rank !== undefined && (
        <span
          aria-hidden="true"
          className="font-display text-3xl font-black text-ink/20 transition-colors group-hover:text-ink"
        >
          {String(rank).padStart(2, "0")}
        </span>
      )}
    </div>
  );
}
