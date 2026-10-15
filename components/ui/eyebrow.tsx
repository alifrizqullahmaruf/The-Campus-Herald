import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/** Tilted yellow tag above a section title. One per section. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "inline-block -rotate-3 rounded-full border-2 border-ink bg-cat-events px-2.5 py-0.5 text-meta text-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}
