"use client";

import { lazy, Suspense, useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import Link from "@/components/ui/link";

// The palette UI is only downloaded the first time someone opens it.
const CommandPalette = lazy(() => import("./command-palette"));

const OPEN_EVENT = "sidenotes:open-search";

/** Asks the mounted trigger to open the palette (used by header buttons). */
export function openSearchPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** Global ⌘K / Ctrl+K listener. Mount once in the public layout. */
export function CommandPaletteTrigger() {
  // A new number for each opening: the palette is keyed by it, so closing and opening again
  // within one render still mounts a fresh dialog. null while closed.
  const [session, setSession] = useState<number | null>(null);
  const open = session !== null;
  const returnFocus = useRef<HTMLElement | null>(null);
  const isOpen = useRef(false);
  const sessions = useRef(0);

  const show = useCallback(() => {
    // Remember where focus was only when opening: with the palette already open, the
    // active element is the palette's own input, which is gone once it closes. (The
    // native <dialog> restores focus by itself in current browsers; this is the fallback.)
    if (isOpen.current) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    isOpen.current = true;
    sessions.current += 1;
    setSession(sessions.current);
  }, []);

  // Called as soon as the palette closes and again by the dialog's late `close` event.
  const close = useCallback(() => {
    if (!isOpen.current) return;
    isOpen.current = false;
    setSession(null);
  }, []);

  // Focus goes back once the palette is gone: while the modal dialog is still open, the
  // rest of the page is inert and cannot take focus.
  useEffect(() => {
    if (open || !returnFocus.current) return;
    returnFocus.current.focus();
    returnFocus.current = null;
  }, [open]);

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
      <CommandPalette key={session} onClose={close} />
    </Suspense>
  );
}

/**
 * Phone header search icon: a link to /search (works without JavaScript) that
 * opens the quick search palette instead on a plain click (docs/design.md 3, Header).
 */
export function SearchIconLink({ className, children }: { className?: string; children: ReactNode }) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openSearchPalette();
  };
  return (
    <Link href="/search" onClick={onClick} aria-haspopup="dialog" className={className}>
      {children}
    </Link>
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
