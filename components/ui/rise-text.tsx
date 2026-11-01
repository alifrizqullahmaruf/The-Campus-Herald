import { Fragment, type CSSProperties } from "react";
import { cx } from "@/lib/cx";

/**
 * Heading text whose words rise out of a mask one after another (docs/design.md
 * 2.5, Word rise), with the home hero's `reveal-line`. CSS only, so it plays
 * without JavaScript and is off under reduced motion. Words rather than lines:
 * where a title wraps depends on the screen.
 *
 * `on="load"` (page titles) plays once when the page opens; `on="scroll"`
 * (section titles) rises as each line comes fully into view (`reveal-word`).
 */
export function RiseText({ text, on = "load" }: { text: string; on?: "load" | "scroll" }) {
  const words = text.split(" ");
  return words.map((word, i) => (
    <Fragment key={i}>
      {/* align-top keeps the line height; the padding (cancelled by the negative
          margin) gives descenders room inside the mask, which clips only top and
          bottom: the display font's tight tracking lets letters reach past the
          word's box at the sides. */}
      <span className={cx("-my-[0.12em] inline-block overflow-y-clip py-[0.12em] align-top", on === "scroll" && "reveal-mask")}>
        {/* 30 ms between words, at most 360 ms for long titles. */}
        <span className={on === "scroll" ? "reveal-word" : "reveal-line"} style={{ "--line": Math.min(i / 3, 4) } as CSSProperties}>
          {word}
        </span>
      </span>
      {i < words.length - 1 && " "}
    </Fragment>
  ));
}
