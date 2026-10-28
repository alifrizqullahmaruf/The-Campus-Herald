import { Fragment, type CSSProperties } from "react";

/**
 * Heading text whose words rise out of a mask one after another (docs/design.md
 * 2.5, Word rise), with the home hero's `reveal-line`. CSS only, so it plays
 * without JavaScript and is off under reduced motion. Words rather than lines:
 * where a title wraps depends on the screen.
 */
export function RiseText({ text }: { text: string }) {
  const words = text.split(" ");
  return words.map((word, i) => (
    <Fragment key={i}>
      {/* align-top keeps the line height; the padding (cancelled by the negative
          margin) gives descenders room inside the mask, which clips only top and
          bottom: the display font's tight tracking lets letters reach past the
          word's box at the sides. */}
      <span className="-my-[0.12em] inline-block overflow-y-clip py-[0.12em] align-top">
        {/* 30 ms between words, at most 360 ms for long titles. */}
        <span className="reveal-line" style={{ "--line": Math.min(i / 3, 4) } as CSSProperties}>
          {word}
        </span>
      </span>
      {i < words.length - 1 && " "}
    </Fragment>
  ));
}
