import Image from "next/image";
import { cx } from "@/lib/cx";
import { isHttpsUrl, isPicsum, isUnsplash } from "@/lib/images";
import type { ArticleWithRelations, CategorySlug } from "@/lib/types";
import { CoverArt } from "./cover-art";
import { PicsumImage } from "./picsum-image";
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
      <CoverImage src={coverImage} seed={article.id} category={article.category.slug} sizes={sizes} priority={priority} />
      {coverImage && coverCredit && (
        // relative z-10 keeps the credit links clickable above a card's stretched link.
        <p className="absolute bottom-1.5 left-1.5 z-10 max-w-[calc(100%-12px)] truncate rounded-full border border-ink bg-surface/90 px-2 py-0.5 text-[10px] text-ink">
          Photo: <CreditLink href={coverCredit.profileUrl}>{coverCredit.name}</CreditLink> on{" "}
          <CreditLink href={coverCredit.photoUrl}>{coverCredit.source}</CreditLink>
        </p>
      )}
    </div>
  );
}

/**
 * The cover picture alone (no frame, no credit), filling its parent: the photo
 * through the loader for its source, or generated art when there is none. Used
 * by ArticleCover and by small thumbnails (Most read, the search palette).
 */
export function CoverImage({
  src,
  seed,
  category,
  sizes,
  priority,
}: {
  src: string | null;
  seed: number;
  category: CategorySlug;
  sizes: string;
  priority?: boolean;
}) {
  if (!src) return <CoverArt seed={seed} category={category} />;
  if (isUnsplash(src)) return <UnsplashImage src={src} alt="" sizes={sizes} priority={priority} />;
  if (isPicsum(src)) return <PicsumImage src={src} alt="" sizes={sizes} priority={priority} />;
  return <Image src={src} alt="" fill sizes={sizes} priority={priority} className="object-cover" />;
}

function CreditLink({ href, children }: { href: string; children: string }) {
  if (!isHttpsUrl(href)) return children;
  return (
    <a href={href} className="underline underline-offset-2">
      {children}
    </a>
  );
}
