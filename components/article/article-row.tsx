import Link from "next/link";
import { CategoryBadge } from "@/components/ui/category-badge";
import { cx } from "@/lib/cx";
import { formatCount } from "@/lib/format";
import type { ArticleWithRelations } from "@/lib/types";
import { CoverImage } from "./article-cover";

/** Compact ranked row for Most read, with a small cover thumbnail. */
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
      <div className="relative size-12 shrink-0 overflow-hidden rounded-md border-2 border-ink">
        <CoverImage src={article.coverImage} seed={article.id} category={article.category.slug} sizes="48px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[15px] font-extrabold leading-tight">
          <Link href={`/articles/${article.slug}`} className="after:absolute after:inset-0">
            {article.title}
          </Link>
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-meta text-ink-muted">
          <CategoryBadge name={article.category.name} className="text-[11px]!" />
          {showViews ? `${formatCount(article.viewCount)} reads` : `${article.readingMinutes} min`}
        </p>
      </div>
      {rank !== undefined && (
        <span
          aria-hidden="true"
          className="inline-block font-display text-3xl font-black text-ink/50 transition-[color,scale,rotate] duration-150 ease-out group-hover:-rotate-6 group-hover:scale-125 group-hover:text-ink"
        >
          {String(rank).padStart(2, "0")}
        </span>
      )}
    </div>
  );
}
