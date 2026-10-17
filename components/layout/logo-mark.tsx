import { MARK_SVG } from "@/lib/brand-mark";
import { cx } from "@/lib/cx";

/**
 * The Side Notes mark (page + sticky note). Decorative: the wordmark next to it
 * carries the name. Size it with a width class; the height follows the artwork.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx("inline-block aspect-[622/450] shrink-0 [&>svg]:size-full", className)}
      // Trusted constant from lib/brand-mark.ts, not user content.
      dangerouslySetInnerHTML={{ __html: MARK_SVG }}
    />
  );
}
