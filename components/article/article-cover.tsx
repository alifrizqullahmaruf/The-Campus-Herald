import Image from "next/image";
import { cx } from "@/lib/cx";
import { isUnsplash } from "@/lib/images";
import type { ArticleWithRelations } from "@/lib/types";
import { CoverArt } from "./cover-art";
import { UnsplashImage } from "./unsplash-image";

/**
 * Framed cover: the article's photo when it has one (with the photographer
 * credit Unsplash requires), generated art otherwise.
 */
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
  const { coverImage, coverCredit } = article;
  return (
    <div className={cx("relative overflow-hidden rounded-inner border-2 border-ink bg-paper", className)}>
      {coverImage ? (
        isUnsplash(coverImage) ? (
          <UnsplashImage src={coverImage} alt="" sizes={sizes} priority={priority} />
        ) : (
          <Image src={coverImage} alt="" fill sizes={sizes} priority={priority} className="object-cover" />
        )
      ) : (
        <CoverArt seed={article.id} category={article.category.slug} />
      )}
      {coverImage && coverCredit && (
        // relative z-10 keeps the credit links clickable above a card's stretched link.
        <p className="absolute bottom-1.5 left-1.5 z-10 max-w-[calc(100%-12px)] truncate rounded-full border border-ink bg-surface/90 px-2 py-0.5 text-[10px] text-ink">
          Photo:{" "}
          <a href={coverCredit.profileUrl} className="underline underline-offset-2">
            {coverCredit.name}
          </a>{" "}
          on{" "}
          <a href={coverCredit.photoUrl} className="underline underline-offset-2">
            {coverCredit.source}
          </a>
        </p>
      )}
    </div>
  );
}
