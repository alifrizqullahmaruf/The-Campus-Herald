import { cx } from "@/lib/cx";

/** Small white label with the category name, top-left on article cards. */
export function CategoryBadge({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cx(
        "inline-block rounded-full border-2 border-ink bg-surface px-2 py-0.5 text-meta text-ink",
        className,
      )}
    >
      {name}
    </span>
  );
}
