import Link from "@/components/ui/link";
import { getCategoryBySlug } from "@/lib/categories";
import { cx } from "@/lib/cx";
import type { AuthorProfile } from "@/lib/data/users";
import { Avatar } from "./avatar";

/**
 * Initials card that flips on hover or keyboard focus to show the bio
 * (docs/design.md 3, Author card). No flip under reduced motion; the bio is
 * on the author page either way.
 */
export function AuthorCard({
  author,
  onDark,
  className,
}: {
  author: AuthorProfile;
  /** Paper outline and shadow, for cards on the ink band. */
  onDark?: boolean;
  className?: string;
}) {
  const category = author.primaryCategory ? getCategoryBySlug(author.primaryCategory) : undefined;
  const tone = cx(
    category ? cx(category.bgClass, category.textClass) : "bg-surface text-ink",
    onDark ? "border-paper shadow-[4px_4px_0_0_var(--color-paper)]" : "border-ink shadow-hard",
  );

  return (
    <Link
      href={`/authors/${author.id}`}
      className={cx("group block aspect-4/5 [perspective:1200px] focus-visible:outline-offset-4", className)}
    >
      <div
        className={cx(
          "relative size-full transition-transform duration-500 [transform-style:preserve-3d]",
          "motion-safe:group-hover:[transform:rotateY(180deg)] motion-safe:group-focus-visible:[transform:rotateY(180deg)]",
        )}
      >
        {/* Front */}
        <div
          className={cx(
            "absolute inset-0 flex flex-col rounded-card border-3 p-3 [backface-visibility:hidden]",
            tone,
          )}
        >
          <span className="text-meta">{author.beat}</span>
          <Avatar userId={author.id} className="my-2 min-h-0 w-full flex-1 object-contain" />
          <span className="flex items-center justify-between gap-2 rounded-full border-2 border-ink bg-surface px-3 py-1 font-display text-sm font-extrabold text-ink">
            {author.name}
            <span aria-hidden="true">↗</span>
          </span>
        </div>

        {/* Back: decorative repeat of the bio, so hidden from assistive tech */}
        <div
          aria-hidden="true"
          className={cx(
            "absolute inset-0 flex flex-col rounded-card border-3 p-4 [backface-visibility:hidden] [transform:rotateY(180deg)]",
            tone,
          )}
        >
          <span className="text-meta">{author.beat}</span>
          {/* Phones don't flip on hover and the card is too small for the bio; it's on the author page. */}
          <p className="mt-3 hidden font-display text-lg font-extrabold leading-snug sm:block">{author.bio}</p>
          <p className="mt-auto text-meta">
            {author.articleCount} {author.articleCount === 1 ? "article" : "articles"} · Read them →
          </p>
        </div>
      </div>
    </Link>
  );
}
