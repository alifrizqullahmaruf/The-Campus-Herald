import Link from "@/components/ui/link";
import { getCategoryBySlug } from "@/lib/categories";
import { cx } from "@/lib/cx";
import type { CategorySlug } from "@/lib/types";

interface CategoryPillProps {
  slug: CategorySlug;
  /** Number of published articles; shown in a bubble when given. */
  count?: number;
  size?: "lg" | "sm";
  /** Defaults to the category page. */
  href?: string;
  className?: string;
}

const SIZES = {
  lg: {
    pill: "gap-3 border-3 px-5 py-2 text-2xl shadow-hard sm:text-3xl",
    icon: "size-6",
    count: "min-w-8 border-2 px-1.5 py-0.5",
  },
  sm: {
    pill: "tap-target gap-1.5 border-2 px-3 py-1 text-sm shadow-[2px_2px_0_0_var(--color-ink)]",
    icon: "size-3.5",
    count: "min-w-5 border px-1",
  },
};

export function CategoryPill({ slug, count, size = "lg", href, className }: CategoryPillProps) {
  const category = getCategoryBySlug(slug);
  if (!category) return null;
  const Icon = category.icon;
  const s = SIZES[size];

  return (
    <Link
      href={href ?? `/categories/${slug}`}
      className={cx(
        "inline-flex items-center rounded-full border-ink font-display font-black",
        "transition-[translate,box-shadow] duration-150 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5",
        category.bgClass,
        category.textClass,
        s.pill,
        className,
      )}
    >
      <Icon aria-hidden="true" className={s.icon} strokeWidth={2.5} />
      <span>{category.name}</span>
      {count !== undefined && (
        <>
          <span
            aria-hidden="true"
            className={cx("rounded-full border-ink bg-surface text-center text-meta text-ink", s.count)}
          >
            {count}
          </span>
          <span className="sr-only">, {count} articles</span>
        </>
      )}
    </Link>
  );
}
