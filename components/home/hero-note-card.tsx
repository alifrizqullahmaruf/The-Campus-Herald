import Link from "next/link";
import { CategoryBadge } from "@/components/ui/category-badge";
import { getCategoryBySlug } from "@/lib/categories";
import { cx } from "@/lib/cx";
import type { ArticleWithRelations } from "@/lib/types";

/** Small square-ish article card for the hero physics pile. */
export function HeroNoteCard({ article }: { article: ArticleWithRelations }) {
  const category = getCategoryBySlug(article.category.slug);
  return (
    <div
      className={cx(
        "relative flex w-36 flex-col rounded-card border-3 border-ink p-2.5 shadow-hard sm:w-44 md:w-52 md:p-3",
        category?.bgClass,
        category?.textClass,
      )}
    >
      <CategoryBadge name={article.category.name} className="self-start text-[11px]!" />
      <p className="mt-2 line-clamp-3 font-display text-sm leading-tight font-extrabold md:text-base">
        {/* Dragging is handled by the pile; a plain press opens the article. */}
        <Link href={`/articles/${article.slug}`} draggable={false} className="after:absolute after:inset-0">
          {article.title}
        </Link>
      </p>
      <p className="mt-2 text-[11px] font-semibold tracking-wide uppercase">{article.author.name}</p>
    </div>
  );
}

/** Round "EDITOR CHECKED" sticker; decorative. */
export function EditorSticker() {
  return (
    <span
      aria-hidden="true"
      className="grid size-20 place-items-center rounded-full border-3 border-ink bg-accent text-center font-display text-[11px] leading-tight font-black shadow-hard md:size-24 md:text-xs"
    >
      EDITOR
      <br />
      CHECKED
    </span>
  );
}

/** Pill sticker, e.g. "5 TOPICS"; decorative. */
export function PillSticker({ children, className }: { children: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-block rounded-full border-3 border-ink px-4 py-1.5 font-display text-sm font-black whitespace-nowrap shadow-hard",
        className,
      )}
    >
      {children}
    </span>
  );
}
