import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cx } from "@/lib/cx";
import type { CategoryStyle } from "@/lib/categories";

/** Large category card for the Categories page (docs/design.md 3, Category tile). */
export function CategoryTile({
  category,
  count,
  className,
}: {
  category: CategoryStyle;
  count: number;
  className?: string;
}) {
  return (
    // @container: the name scales with the tile width, so "Organisations" fits a half-width tile.
    <Card tone={category.slug} lift className={cx("@container relative flex min-h-56 flex-col p-5 md:p-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full border-2 border-ink bg-surface px-2.5 py-0.5 text-meta text-ink">
          {count} {count === 1 ? "article" : "articles"} in the archive
        </span>
        <span aria-hidden="true" className="text-meta">
          Open the desk ↗
        </span>
      </div>
      <h2 className="mt-auto pt-8 font-display text-[clamp(26px,9.5cqi,80px)] font-black leading-none">
        <Link href={`/categories/${category.slug}`} className="after:absolute after:inset-0 after:rounded-card">
          {category.name}
        </Link>
      </h2>
      <p className="mt-3 max-w-md">{category.description}</p>
    </Card>
  );
}
