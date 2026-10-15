import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

/** Centred content column: max 1120px with 16/24/32px side gutters (docs/design.md 2.4). */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("mx-auto w-full max-w-[1120px] px-4 sm:px-6 lg:px-8", className)} {...props} />;
}
