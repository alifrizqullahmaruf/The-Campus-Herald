// Small pure helpers shared by the draggable / physics components.

import type { CSSProperties } from "react";

/** Pointer travel (px) before a press counts as a drag instead of a click. */
export const DRAG_THRESHOLD = 5;

/** True once the pointer has moved far enough from where it went down. */
export function isDrag(dx: number, dy: number, threshold = DRAG_THRESHOLD): boolean {
  return Math.hypot(dx, dy) >= threshold;
}

/**
 * Keeps a looping track's offset within (-period, 0], so a track made of two
 * identical copies can scroll forever in either direction without a jump.
 */
export function wrapOffset(x: number, period: number): number {
  if (period <= 0) return 0;
  const r = x % period;
  return r > 0 ? r - period : r;
}

export interface Point {
  x: number;
  y: number;
}

/**
 * Maps a viewport point into an element's own, untransformed coordinates, even
 * when an ancestor is rotated or moved (e.g. the scroll-driven hero tilt).
 * `origin`, `xAxis` and `yAxis` are where the element's local points (0, 0),
 * (unit, 0) and (0, unit) currently appear on screen.
 */
export function toLocal(p: Point, origin: Point, xAxis: Point, yAxis: Point, unit = 100): Point {
  const a = (xAxis.x - origin.x) / unit;
  const b = (xAxis.y - origin.y) / unit;
  const c = (yAxis.x - origin.x) / unit;
  const d = (yAxis.y - origin.y) / unit;
  const dx = p.x - origin.x;
  const dy = p.y - origin.y;
  const det = a * d - b * c;
  if (Math.abs(det) < 1e-9) return { x: dx, y: dy };
  return { x: (d * dx - c * dy) / det, y: (a * dy - b * dx) / det };
}

/** True when the user asked the OS for less motion (false on the server). */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Deterministic pseudo-random number in [0, 1) from an integer seed, so server
 * and browser agree on "random" tilts and positions (no hydration mismatch).
 */
export function seeded(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Start pose of the i-th `pile-card` (globals.css) in a grid of `columns`:
 * pulled toward the middle column and toward the next row, with a seeded tilt.
 * The pull is used from lg up; narrower screens get a fifth of the tilt only.
 * `--pile-i` staggers cards that settle on load (`data-pile="load"`).
 */
export function pileStyle(i: number, columns: number): CSSProperties {
  const col = i % columns;
  const row = Math.floor(i / columns);
  return {
    "--px": `${((columns - 1) / 2 - col) * 100 + Math.round(seeded(i + 11) * 20 - 10)}%`,
    "--py": `${(row === 0 ? 1 : -1) * 45}%`,
    "--pr": `${Math.round(seeded(i + 21) * 30 - 15)}deg`,
    "--pile-i": i,
  } as CSSProperties;
}

/** Browsers (and test environments) without the APIs the animated pieces rely on. */
export function canAnimate(): boolean {
  return typeof window !== "undefined" && typeof IntersectionObserver !== "undefined" && typeof requestAnimationFrame !== "undefined";
}

/**
 * Resolves once the elements' own running animations have ended, e.g. a
 * headline still rising into place before the physics piles measure it as an
 * obstacle (measured mid-rise it sits lower than the text). Endless animations
 * never end, so the wait is capped.
 */
export function entranceDone(elements: Element[], cap = 1000): Promise<void> {
  const running = elements
    .flatMap((el) => el.getAnimations?.() ?? [])
    .filter((animation) => animation.playState === "running");
  if (running.length === 0) return Promise.resolve();
  return Promise.race([
    Promise.allSettled(running.map((animation) => animation.finished)).then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, cap)),
  ]);
}
