import { cx } from "@/lib/cx";
import type { CategorySlug } from "@/lib/types";

const FILL: Record<CategorySlug, string> = {
  academics: "var(--color-cat-academics)",
  organisations: "var(--color-cat-organisations)",
  events: "var(--color-cat-events)",
  opinion: "var(--color-cat-opinion)",
  achievements: "var(--color-cat-achievements)",
};

const INK = "var(--color-ink)";
const PAPER = "var(--color-paper)";

/**
 * Geometric placeholder artwork used when an article has no cover photo.
 * Deterministic per seed so the same article always gets the same pattern.
 * Purely decorative: the title next to it carries the meaning.
 */
export function CoverArt({
  seed,
  category,
  className,
}: {
  seed: number;
  category: CategorySlug;
  className?: string;
}) {
  const fill = FILL[category];
  const variant = seed % 4;
  const shift = (seed * 37) % 60;

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className={cx("block size-full", className)}
    >
      <rect width="400" height="300" fill={PAPER} />
      {variant === 0 && (
        // Big overlapping circles.
        <g stroke={INK} strokeWidth="8">
          <circle cx={120 + shift} cy="150" r="110" fill={fill} />
          <circle cx={290 - shift / 2} cy="120" r="70" fill={PAPER} />
          <circle cx={300 - shift / 2} cy="230" r="40" fill={INK} />
        </g>
      )}
      {variant === 1 && (
        // Diagonal stripes with a block.
        <g>
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={i * 50 - 150 + shift} y="-50" width="22" height="420" fill={fill} transform="rotate(30 200 150)" />
          ))}
          <rect x="130" y="80" width="140" height="140" rx="16" fill={PAPER} stroke={INK} strokeWidth="8" />
          <rect x="165" y="115" width="70" height="70" rx="8" fill={INK} />
        </g>
      )}
      {variant === 2 && (
        // Dot grid with a half circle.
        <g>
          {Array.from({ length: 8 }, (_, row) =>
            Array.from({ length: 10 }, (_, col) => (
              <circle key={`${row}-${col}`} cx={col * 44 + 22} cy={row * 44 + 10} r="7" fill={INK} opacity="0.85" />
            )),
          )}
          <path d={`M ${60 + shift} 300 A 140 140 0 0 1 ${340 + shift / 3} 300 Z`} fill={fill} stroke={INK} strokeWidth="8" />
        </g>
      )}
      {variant === 3 && (
        // Stacked triangles.
        <g stroke={INK} strokeWidth="8" strokeLinejoin="round">
          <polygon points={`${40 + shift},260 160,40 280,260`} fill={fill} />
          <polygon points={`200,260 ${300 + shift / 2},90 380,260`} fill={PAPER} />
          <circle cx="330" cy="60" r="26" fill={INK} />
        </g>
      )}
    </svg>
  );
}
