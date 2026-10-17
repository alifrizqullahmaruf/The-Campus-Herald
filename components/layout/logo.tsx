import Link from "next/link";
import { cx } from "@/lib/cx";
import { SITE } from "@/lib/site";
import { LogoMark } from "./logo-mark";

/** Page-and-sticky-note mark + "Side Notes / by The Campus Herald" wordmark. */
export function Logo({ className, onDark }: { className?: string; onDark?: boolean }) {
  return (
    <Link href="/" className={cx("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="w-11" />
      <span className={cx("leading-none", onDark && "text-paper")}>
        <span className="block font-display text-base font-black uppercase">{SITE.name}</span>
        <span className="mt-0.5 block text-[10px] font-semibold tracking-wide text-ink-muted">by {SITE.parent}</span>
      </span>
    </Link>
  );
}
