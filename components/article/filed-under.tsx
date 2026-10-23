import Link from "next/link";
import { CategoryPill } from "@/components/ui/category-pill";
import { getCategoryBySlug } from "@/lib/categories";
import type { CategorySlug } from "@/lib/types";

/** "Filed under" box beside the article body. */
export function FiledUnder({ slug }: { slug: CategorySlug }) {
  const category = getCategoryBySlug(slug);
  if (!category) return null;
  return (
    <aside aria-label="Filed under" className="rounded-card border-3 border-ink bg-surface p-4 shadow-hard">
      <p className="text-meta text-ink-muted">Filed under</p>
      <div className="mt-2">
        <CategoryPill slug={slug} size="sm" />
      </div>
      <p className="mt-3 text-sm text-ink-muted">{category.description}</p>
      <ul className="mt-4 space-y-2 font-display text-sm font-extrabold">
        <li>
          <Link href={`/categories/${slug}`} className="tap-target underline-offset-4 hover:underline">
            More in {category.name} →
          </Link>
        </li>
        <li>
          <Link href="/search" className="tap-target underline-offset-4 hover:underline">
            All articles →
          </Link>
        </li>
      </ul>
    </aside>
  );
}
