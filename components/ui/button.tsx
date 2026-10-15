import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";

type Variant = "primary" | "secondary" | "dark" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-cat-events text-ink",
  secondary: "bg-surface text-ink",
  dark: "bg-ink text-cat-events",
  danger: "bg-cat-opinion text-ink",
};

// Pill button with hard shadow: lifts on hover, presses on click (docs/design.md 3, Button).
const BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border-3 border-ink px-5 " +
  "font-display text-[15px] font-extrabold shadow-hard transition-[translate,box-shadow] duration-150 ease-out " +
  "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lift " +
  "active:translate-x-1 active:translate-y-1 active:shadow-none " +
  "disabled:pointer-events-none disabled:opacity-50";

interface CommonProps {
  variant?: Variant;
  /** Adds a trailing arrow, for buttons that navigate. */
  arrow?: boolean;
  className?: string;
  children: ReactNode;
}

type ButtonProps = CommonProps &
  (
    | ({ href: string } & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">)
    | ({ href?: undefined } & Omit<ComponentProps<"button">, "className" | "children">)
  );

export function Button({ variant = "primary", arrow, className, children, ...props }: ButtonProps) {
  const classes = cx(BASE, VARIANTS[variant], className);
  const content = (
    <>
      {children}
      {arrow && <span aria-hidden="true">→</span>}
    </>
  );

  if (props.href !== undefined) {
    return (
      <Link className={classes} {...props}>
        {content}
      </Link>
    );
  }
  const { type = "button", ...buttonProps } = props as ComponentProps<"button">;
  return (
    <button type={type} className={classes} {...buttonProps}>
      {content}
    </button>
  );
}
