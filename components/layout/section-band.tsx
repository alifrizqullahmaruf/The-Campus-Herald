import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

/** Full-bleed coloured section with ink rules top and bottom. Pass the bg class via className. */
export function SectionBand({ className, ...props }: ComponentProps<"section">) {
  return <section className={cx("border-y-3 border-ink py-16 md:py-24", className)} {...props} />;
}
