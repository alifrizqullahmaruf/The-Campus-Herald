"use client";

import { useEffect, useRef, useState } from "react";
import { canAnimate, prefersReducedMotion } from "@/lib/motion";

/**
 * A number that counts up from 0 when it scrolls into view (docs/design.md 2.5,
 * Count up). The server HTML holds the final value, and a number that is
 * already on screen when the page loads keeps it (counting would make it
 * flicker). Screen readers always get the final value.
 */
export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || value === 0 || prefersReducedMotion() || !canAnimate()) return;
    const box = el.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) return;

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // The first report comes while it is still off screen: start from 0.
        if (entry.intersectionRatio < 0.6) {
          setShown(0);
          return;
        }
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          // Ease out: fast at first, settling on the value.
          setShown(Math.round(value * (1 - (1 - t) ** 3)));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: [0, 0.6] },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <>
      <span className="sr-only">{value}</span>
      <span ref={ref} aria-hidden="true">
        {shown}
      </span>
    </>
  );
}
