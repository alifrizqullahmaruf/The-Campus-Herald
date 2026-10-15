"use client";

import { Children, useState, type ReactNode } from "react";
import { Button } from "./button";

/**
 * Shows the first `initial` children and reveals `step` more per click.
 * Children are rendered on the server; this only controls how many are visible.
 */
export function LoadMore({
  children,
  initial = 6,
  step = 6,
  className,
}: {
  children: ReactNode;
  initial?: number;
  step?: number;
  className?: string;
}) {
  const items = Children.toArray(children);
  const [visible, setVisible] = useState(initial);
  const shown = Math.min(visible, items.length);

  return (
    <>
      <ul className={className}>{items.slice(0, shown)}</ul>
      <div className="mt-10 flex flex-col items-center gap-3">
        <p aria-live="polite" className="text-meta text-ink-muted">
          Showing {shown} of {items.length}
        </p>
        {shown < items.length && (
          <Button variant="secondary" onClick={() => setVisible((v) => v + step)}>
            Load more
          </Button>
        )}
      </div>
    </>
  );
}
