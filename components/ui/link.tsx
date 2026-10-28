import NextLink from "next/link";
import type { ComponentProps } from "react";

/**
 * Transition type for page changes. The root <ViewTransition> fades the new
 * page in only for transitions of this type (globals.css, Page changes), so
 * content that loads in later (Suspense, the editor, the ⌘K palette) does not
 * fade the page again. Pass it to router.push / replace as well.
 */
export const PAGE_TRANSITION = ["page"];

/** next/link that marks the navigation as a page change. Use it instead of next/link. */
export default function Link(props: ComponentProps<typeof NextLink>) {
  return <NextLink transitionTypes={PAGE_TRANSITION} {...props} />;
}
