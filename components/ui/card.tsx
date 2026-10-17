import type { ComponentProps } from "react";
import { getCategoryBySlug } from "@/lib/categories";
import { cx } from "@/lib/cx";
import type { CategorySlug } from "@/lib/types";

interface CardProps extends ComponentProps<"div"> {
  /** "surface" for white cards, or a category slug to fill with its colour. */
  tone?: "surface" | CategorySlug;
  /** Lift and tilt on hover or keyboard focus inside the card. */
  lift?: boolean;
}

const LIFT =
  "transition-[translate,rotate,box-shadow] duration-150 ease-out " +
  "hover:-translate-x-1 hover:-translate-y-1.5 hover:-rotate-2 hover:shadow-hard-lift " +
  "focus-within:-translate-x-0.5 focus-within:-translate-y-0.5 focus-within:shadow-hard-lift";

/** Outlined card with hard shadow; the shell for article cards, tiles and widgets. */
export function Card({ tone = "surface", lift, className, ...props }: CardProps) {
  const category = tone === "surface" ? undefined : getCategoryBySlug(tone);
  return (
    <div
      className={cx(
        "rounded-card border-3 border-ink shadow-hard",
        category ? cx(category.bgClass, category.textClass) : "bg-surface text-ink",
        lift && LIFT,
        className,
      )}
      {...props}
    />
  );
}
