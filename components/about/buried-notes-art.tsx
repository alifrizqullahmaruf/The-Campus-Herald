import { cx } from "@/lib/cx";

const INK = "var(--color-ink)";
const PAPER = "var(--color-paper)";
const SURFACE = "var(--color-surface)";
const NOTE = "var(--color-cat-events)";
const ACCENT = "var(--color-accent)";

interface Bubble {
  x: number;
  y: number;
  w: number;
  h: number;
  rotate: number;
  fill: string;
  /** Line colour for the "text": paper on dark blue, ink elsewhere. */
  lines?: string;
  /** Which side the tail points to (sender on the left, you on the right). */
  tail: "left" | "right";
}

// Drawn back to front: the sticky note sits between the back and front bubbles,
// so it looks like it is climbing out of the pile.
const BACK: Bubble[] = [
  { x: 130, y: 62, w: 84, h: 30, rotate: 0, fill: SURFACE, tail: "left" },
  { x: 214, y: 66, w: 58, h: 28, rotate: 0, fill: "var(--color-cat-organisations)", tail: "right" },
  { x: 34, y: 148, w: 132, h: 54, rotate: -9, fill: "var(--color-cat-opinion)", tail: "left" },
  { x: 236, y: 140, w: 136, h: 54, rotate: 8, fill: "var(--color-cat-academics)", lines: PAPER, tail: "right" },
];
const FRONT: Bubble[] = [
  { x: 62, y: 206, w: 150, h: 56, rotate: 5, fill: "var(--color-cat-organisations)", tail: "left" },
  { x: 204, y: 198, w: 152, h: 58, rotate: -6, fill: "var(--color-cat-achievements)", tail: "right" },
  { x: 14, y: 250, w: 140, h: 54, rotate: -4, fill: SURFACE, tail: "left" },
  { x: 150, y: 252, w: 120, h: 52, rotate: 3, fill: "var(--color-cat-opinion)", tail: "right" },
  { x: 268, y: 248, w: 132, h: 54, rotate: 6, fill: SURFACE, tail: "right" },
];

function ChatBubble({ x, y, w, h, rotate, fill, lines = INK, tail }: Bubble) {
  const tailPath =
    tail === "left"
      ? `M ${x + 14} ${y + h - 4} L ${x - 2} ${y + h + 14} L ${x + 30} ${y + h - 4} Z`
      : `M ${x + w - 30} ${y + h - 4} L ${x + w + 2} ${y + h + 14} L ${x + w - 14} ${y + h - 4} Z`;
  const rows = h >= 50 ? 2 : 1;
  return (
    <g transform={`rotate(${rotate} ${x + w / 2} ${y + h / 2})`}>
      <path d={tailPath} fill={fill} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
      <rect x={x} y={y} width={w} height={h} rx="16" fill={fill} stroke={INK} strokeWidth="6" />
      {Array.from({ length: rows }, (_, i) => (
        <line
          key={i}
          x1={x + 16}
          y1={y + (rows === 1 ? h / 2 : 18 + i * 18)}
          // The last of two lines is shorter, like the end of a sentence.
          x2={x + w - (rows > 1 && i === rows - 1 ? 44 : 18)}
          y2={y + (rows === 1 ? h / 2 : 18 + i * 18)}
          stroke={lines}
          strokeWidth="6"
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}

/**
 * About page illustration for "Group chats bury the news": chat bubbles in the
 * topic colours pile up over a phone while one yellow sticky note (the Side
 * Notes mark) climbs out of the pile. Decorative; the heading carries the meaning.
 */
export function BuriedNotesArt({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className={cx("block size-full", className)}
    >
      <rect width="400" height="300" fill={PAPER} />
      {Array.from({ length: 6 }, (_, row) =>
        Array.from({ length: 9 }, (_, col) => (
          <circle key={`${row}-${col}`} cx={col * 46 + 16} cy={row * 46 + 16} r="2.5" fill={INK} opacity="0.2" />
        )),
      )}

      {/* The phone, its screen already full of messages. */}
      <rect x="116" y="30" width="168" height="300" rx="28" fill={SURFACE} stroke={INK} strokeWidth="8" />
      <rect x="176" y="42" width="48" height="8" rx="4" fill={INK} />

      {BACK.map((b, i) => (
        <ChatBubble key={i} {...b} />
      ))}

      {/* The sticky note climbing out: shadow, note, folded corner, lines. */}
      <g transform="rotate(-10 205 140)">
        <rect x="160" y="84" width="104" height="104" rx="4" fill={INK} transform="translate(8 8)" />
        <rect x="160" y="84" width="104" height="104" rx="4" fill={NOTE} stroke={INK} strokeWidth="7" />
        <path d="M 264 104 L 244 84" stroke={INK} strokeWidth="6" strokeLinecap="round" />
        <line x1="178" y1="112" x2="244" y2="112" stroke={INK} strokeWidth="6" strokeLinecap="round" />
        <line x1="178" y1="132" x2="234" y2="132" stroke={INK} strokeWidth="6" strokeLinecap="round" />
        <path d="M 180 156 C 192 140 200 170 212 152 S 230 160 242 148" fill="none" stroke={ACCENT} strokeWidth="7" strokeLinecap="round" />
      </g>

      {FRONT.map((b, i) => (
        <ChatBubble key={i} {...b} />
      ))}
    </svg>
  );
}
