import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
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
}

const TITLE_SIZE = {
  h1: "text-[clamp(40px,7vw,80px)]",
  h2: "text-[clamp(32px,5vw,56px)]",
};

/** Eyebrow + short display title ending in a full stop + optional aside. */
export function SectionHeader({ eyebrow, title, aside, as: Heading = "h2", id, className }: SectionHeaderProps) {
  return (
    <div className={cx("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <Heading id={id} className={cx("mt-2 font-display font-black leading-[0.95]", TITLE_SIZE[Heading])}>
          {title}
        </Heading>
      </div>
      {aside && <div className="max-w-sm text-ink-muted md:pb-2 md:text-right">{aside}</div>}
    </div>
  );
}
