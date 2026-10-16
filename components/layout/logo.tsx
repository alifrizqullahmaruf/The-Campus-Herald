import Link from "next/link";
import { cx } from "@/lib/cx";
import { SITE } from "@/lib/site";

/** "SN" mark + "Side Notes / by The Campus Herald" wordmark. */
export function Logo({ className, onDark }: { className?: string; onDark?: boolean }) {
  return (
    <Link href="/" className={cx("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className="grid size-9 -rotate-3 place-items-center rounded-lg border-2 border-ink bg-ink font-display text-sm font-black text-cat-events"
      >
        {SITE.monogram}
      </span>
      <span className={cx("leading-none", onDark && "text-paper")}>
        <span className="block font-display text-base font-black uppercase">{SITE.name}</span>
        <span className="mt-0.5 block text-[10px] font-semibold tracking-wide text-ink-muted">by {SITE.parent}</span>
      </span>
    </Link>
  );
}
