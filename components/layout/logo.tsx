import Link from "next/link";
import { cx } from "@/lib/cx";
import { SITE } from "@/lib/site";
import { LogoMark } from "./logo-mark";

/** Page-and-sticky-note mark + "Side Notes / by The Campus Herald" wordmark. */
export function Logo({ className, onDark }: { className?: string; onDark?: boolean }) {
  return (
    <Link href="/" className={cx("logo-link inline-flex items-center gap-2 min-[360px]:gap-2.5", className)}>
      {/* A smaller mark below 360px keeps both lines on one row next to the header buttons. */}
      <LogoMark className="w-9 min-[360px]:w-11" />
      <span className={cx("leading-none", onDark && "text-paper")}>
        <span className="block font-display text-base font-black whitespace-nowrap uppercase">{SITE.name}</span>
        <span className="mt-0.5 block text-[11px] font-semibold tracking-wide whitespace-nowrap text-ink-muted">by {SITE.parent}</span>
      </span>
    </Link>
  );
}
