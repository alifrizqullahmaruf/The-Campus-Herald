import Link from "@/components/ui/link";
import { CategoryBadge } from "@/components/ui/category-badge";
import type { ArticleWithRelations } from "@/lib/types";

/**
 * Scrolling ticker of the latest headlines. Hidden from screen readers because
 * the same headlines are listed in the Latest section; links are not focusable
 * for the same reason. Static under reduced motion (globals.css).
 */
export function Marquee({ articles }: { articles: ArticleWithRelations[] }) {
  const items = articles.map((article) => (
    <Link
      key={article.id}
      href={`/articles/${article.slug}`}
      tabIndex={-1}
      className="inline-flex shrink-0 items-center gap-2 px-5 font-display text-sm font-extrabold"
    >
      <CategoryBadge name={article.category.name} />
      {article.title}
    </Link>
  ));

  return (
    <div aria-hidden="true" className="group overflow-hidden border-y-3 border-ink bg-ink py-3 text-paper">
      <div className="marquee-track flex w-max group-hover:[animation-play-state:paused]">
        <div className="flex">{items}</div>
        <div className="flex">{items}</div>
      </div>
    </div>
  );
}
