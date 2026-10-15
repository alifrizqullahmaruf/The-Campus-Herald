import { Button } from "@/components/ui/button";
import { getCategoryBySlug } from "@/lib/categories";
import { cx } from "@/lib/cx";
import { initials } from "@/lib/format";
import type { AuthorSummary, CategorySlug } from "@/lib/types";

/** Byline card under the article. The avatar takes the article's category colour. */
export function AuthorBox({ author, category }: { author: AuthorSummary; category: CategorySlug }) {
  const style = getCategoryBySlug(category);
  return (
    <section
      aria-label="About the author"
      className="flex flex-col gap-4 rounded-card border-3 border-ink bg-surface p-5 shadow-hard sm:flex-row sm:items-center"
    >
      <span
        aria-hidden="true"
        className={cx(
          "grid size-16 shrink-0 place-items-center rounded-full border-3 border-ink font-display text-xl font-black",
          style?.bgClass,
          style?.textClass,
        )}
      >
        {initials(author.name)}
      </span>
      <div className="flex-1">
        <p className="text-meta text-ink-muted">Written by · {author.beat}</p>
        <p className="mt-1 font-display text-xl font-black">{author.name}</p>
        <p className="mt-1 text-ink-muted">{author.bio}</p>
      </div>
      <Button href={`/authors/${author.id}`} variant="dark" arrow>
        More from {author.name.split(" ")[0]}
      </Button>
    </section>
  );
}
