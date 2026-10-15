import Link from "next/link";
import { cx } from "@/lib/cx";

/** Placeholder mark ("CH" monogram) until the society provides a real logo. */
export function Logo({ className, onDark }: { className?: string; onDark?: boolean }) {
  return (
    <Link href="/" className={cx("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-lg border-2 border-ink bg-ink font-display text-sm font-black text-cat-events"
      >
        CH
      </span>
      <span className={cx("font-display text-sm font-black uppercase leading-none", onDark && "text-paper")}>
        The Campus
        <br />
        Herald
      </span>
    </Link>
  );
}
