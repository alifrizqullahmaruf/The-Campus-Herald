import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/**
 * Tilted yellow tag above a section title. One per section. `reveal` pops it
 * into its tilt (`reveal-pop`): as it scrolls fully into view, on load
 * (`"load"`), or on load from lg only (`"load-lg"`, the sticky topic sidebar).
 */
export function Eyebrow({
  children,
  className,
  reveal,
}: {
  children: ReactNode;
  className?: string;
  reveal?: "scroll" | "load" | "load-lg";
}) {
  return (
    <span
      data-reveal={reveal === "scroll" ? undefined : reveal}
      className={cx(
        "inline-block -rotate-3 rounded-full border-2 border-ink bg-cat-events px-2.5 py-0.5 text-meta text-ink",
        reveal && "reveal-pop",
        className,
      )}
    >
      {children}
    </span>
  );
}
