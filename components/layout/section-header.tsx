import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RiseText } from "@/components/ui/rise-text";
import { cx } from "@/lib/cx";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  /** Short note shown to the right on desktop, below on phone. */
  aside?: ReactNode;
  /** Heading level; sections are h2, page titles h1. */
  as?: "h1" | "h2";
  id?: string;
  className?: string;
  /**
   * Entrance motion for the eyebrow and title (About). A page title header
   * plays on load (eyebrow pop, aside rise); a section title rises as it
   * scrolls into view.
   */
  reveal?: boolean;
}

const TITLE_SIZE = {
  h1: "text-[clamp(40px,7vw,80px)]",
  h2: "text-[clamp(32px,5vw,56px)]",
};

/** Eyebrow + short display title ending in a full stop + optional aside. */
export function SectionHeader({ eyebrow, title, aside, as: Heading = "h2", id, className, reveal }: SectionHeaderProps) {
  const page = Heading === "h1";
  return (
    <div className={cx("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div>
        {eyebrow && <Eyebrow reveal={reveal ? (page ? "load" : "scroll") : undefined}>{eyebrow}</Eyebrow>}
        <Heading id={id} className={cx("mt-2 font-display font-black leading-[0.95]", TITLE_SIZE[Heading])}>
          {/* Page titles rise in word by word on load; section titles stay
              still unless `reveal` lets them rise as they scroll in. */}
          {page ? <RiseText text={title} /> : reveal ? <RiseText text={title} on="scroll" /> : title}
        </Heading>
      </div>
      {aside && (
        <div
          data-reveal={reveal && page ? "load" : undefined}
          className={cx("max-w-sm text-ink-muted md:pb-2 md:text-right", reveal && page && "reveal-rise")}
        >
          {aside}
        </div>
      )}
    </div>
  );
}
