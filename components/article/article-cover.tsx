import Image from "next/image";
import { cx } from "@/lib/cx";
import type { ArticleWithRelations } from "@/lib/types";
import { CoverArt } from "./cover-art";

/** Framed cover: the article's photo when it has one, generated art otherwise. */
export function ArticleCover({
  article,
  className,
  sizes = "(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw",
  priority,
}: {
  article: ArticleWithRelations;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div className={cx("relative overflow-hidden rounded-inner border-2 border-ink bg-paper", className)}>
      {article.coverImage ? (
        <Image src={article.coverImage} alt="" fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <CoverArt seed={article.id} category={article.category.slug} />
      )}
    </div>
  );
}
