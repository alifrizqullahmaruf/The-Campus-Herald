"use client";

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";

// The palette UI is only downloaded the first time someone opens it.
const CommandPalette = lazy(() => import("./command-palette"));

const OPEN_EVENT = "sidenotes:open-search";

/** Asks the mounted trigger to open the palette (used by header buttons). */
export function openSearchPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** Global ⌘K / Ctrl+K listener. Mount once in the public layout. */
export function CommandPaletteTrigger() {
  const [open, setOpen] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);

  const show = useCallback(() => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    returnFocus.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, show);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, show);
    };
  }, [show]);

  if (!open) return null;
  return (
    <Suspense fallback={null}>
      <CommandPalette onClose={close} />
    </Suspense>
  );
}

/** Small "⌘K" chip that opens the palette. */
export function OpenPaletteButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openSearchPalette} className={className}>
      <span aria-hidden="true">⌘K</span>
      <span className="sr-only">Open quick search</span>
    </button>
  );
}
