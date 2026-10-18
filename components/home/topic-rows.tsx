"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { canAnimate, isDrag, prefersReducedMotion, wrapOffset } from "@/lib/motion";

const SPEED = 36; // px per second, as in the template (~30–50 px/s)
const FRICTION = 0.94; // momentum kept per frame after a throw

/**
 * Rows of topic pills that drift sideways in alternating directions and can be
 * grabbed and thrown (template: "Grab a row and drag it"). Each row renders its
 * items twice; the second copy is hidden from assistive tech and the tab order.
 * Drifting pauses on hover/focus and stops under reduced motion; dragging
 * always works. A press that moves less than DRAG_THRESHOLD is a normal click.
 */
export function TopicRows({ rows, label }: { rows: ReactNode[][]; label: string }) {
  return (
    <div role="group" aria-label={label} className="space-y-4">
      {rows.map((items, i) => (
        <DriftRow key={i} direction={i % 2 === 0 ? -1 : 1}>
          {items}
        </DriftRow>
      ))}
    </div>
  );
}

function DriftRow({ children, direction }: { children: ReactNode[]; direction: 1 | -1 }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    const track = trackRef.current;
    if (!row || !track || !canAnimate()) return;

    const reduced = prefersReducedMotion();
    let x = 0;
    let velocity = 0;
    let paused = false;
    let visible = true;
    let last = performance.now();
    let frame = 0;
    // Drag state
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let startOffset = 0;
    let dragging = false;
    let lastMoveX = 0;
    let lastMoveT = 0;
    let suppressClick = false;

    const period = () => track.scrollWidth / 2;
    const apply = () => {
      x = wrapOffset(x, period());
      track.style.translate = `${x}px 0`;
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!dragging) {
        const drift = reduced || paused ? 0 : direction * SPEED;
        x += (drift + velocity) * dt;
        velocity *= FRICTION;
        if (Math.abs(velocity) < 1) velocity = 0;
      }
      apply();
      if (visible) frame = requestAnimationFrame(tick);
    };

    const start = () => {
      cancelAnimationFrame(frame);
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      startOffset = x;
      lastMoveX = e.clientX;
      lastMoveT = performance.now();
      dragging = false;
      suppressClick = false;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!dragging) {
        // A mostly vertical swipe is a page scroll, not a drag.
        if (!isDrag(dx, dy) || Math.abs(dy) > Math.abs(dx)) return;
        dragging = true;
        suppressClick = true;
        row.setPointerCapture(e.pointerId);
        row.dataset.dragging = "true";
      }
      const now = performance.now();
      velocity = ((e.clientX - lastMoveX) / Math.max(1, now - lastMoveT)) * 1000;
      lastMoveX = e.clientX;
      lastMoveT = now;
      x = startOffset + dx;
      apply();
    };
    const onPointerUp = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return;
      pointerId = null;
      if (dragging) {
        dragging = false;
        delete row.dataset.dragging;
        velocity = Math.max(-2500, Math.min(2500, velocity));
      }
      // The click ending this drag (if the browser sends one) fires before this
      // timeout; touch drags send none, and a later Enter must still work.
      if (suppressClick) window.setTimeout(() => (suppressClick = false), 0);
    };
    // Links would otherwise start the browser's own drag and cancel ours.
    const onDragStart = (e: DragEvent) => e.preventDefault();
    // A drag must not also open the pill's link.
    const onClickCapture = (e: MouseEvent) => {
      if (suppressClick) {
        e.preventDefault();
        e.stopPropagation();
        suppressClick = false;
      }
    };
    const pause = () => (paused = true);
    const resume = () => (paused = false);

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else cancelAnimationFrame(frame);
    });
    observer.observe(row);

    row.addEventListener("pointerdown", onPointerDown);
    row.addEventListener("pointermove", onPointerMove);
    row.addEventListener("pointerup", onPointerUp);
    row.addEventListener("pointercancel", onPointerUp);
    row.addEventListener("click", onClickCapture, true);
    row.addEventListener("dragstart", onDragStart);
    row.addEventListener("mouseenter", pause);
    row.addEventListener("mouseleave", resume);
    row.addEventListener("focusin", pause);
    row.addEventListener("focusout", resume);
    start();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      row.removeEventListener("pointerdown", onPointerDown);
      row.removeEventListener("pointermove", onPointerMove);
      row.removeEventListener("pointerup", onPointerUp);
      row.removeEventListener("pointercancel", onPointerUp);
      row.removeEventListener("click", onClickCapture, true);
      row.removeEventListener("dragstart", onDragStart);
      row.removeEventListener("mouseenter", pause);
      row.removeEventListener("mouseleave", resume);
      row.removeEventListener("focusin", pause);
      row.removeEventListener("focusout", resume);
    };
  }, [direction]);

  return (
    <div
      ref={rowRef}
      // pan-y: vertical swipes still scroll the page on touch screens.
      className="cursor-grab touch-pan-y overflow-hidden py-2 select-none data-[dragging=true]:cursor-grabbing"
    >
      {/* Each copy ends with the same gap (pr-4), so half the track width is one exact loop period. */}
      <div ref={trackRef} className="flex w-max will-change-transform">
        <ul className="flex gap-4 pr-4">
          {children.map((child, i) => (
            <li key={i} className="shrink-0">
              {child}
            </li>
          ))}
        </ul>
        {/* Second copy for the seamless loop; not exposed to assistive tech. */}
        <ul className="flex gap-4 pr-4" aria-hidden="true" inert>
          {children.map((child, i) => (
            <li key={i} className="shrink-0">
              {child}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
