"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { CategoryPill } from "@/components/ui/category-pill";
import { NAV_LINKS } from "./nav-links";

/** Phone-only menu button that opens a full-screen sheet. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    // The sheet is hidden from md up (rotating a tablet, widening a window): close it
    // there too, or the page would stay scroll-locked behind an invisible dialog.
    const wide = typeof window.matchMedia === "function" ? window.matchMedia("(min-width: 48rem)") : null;
    const onWide = () => {
      if (wide?.matches) setOpen(false);
    };
    wide?.addEventListener("change", onWide);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      wide?.removeEventListener("change", onWide);
    };
  }, [open]);

  function close() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="grid size-11 place-items-center rounded-full border-3 border-ink bg-surface shadow-hard md:hidden"
      >
        <Menu aria-hidden="true" className="size-5" strokeWidth={2.5} />
        <span className="sr-only">Open menu</span>
      </button>

      {open && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-paper px-4 py-4 md:hidden"
        >
          <div className="flex justify-end">
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              className="grid size-11 place-items-center rounded-full border-3 border-ink bg-surface shadow-hard"
            >
              <X aria-hidden="true" className="size-5" strokeWidth={2.5} />
              <span className="sr-only">Close menu</span>
            </button>
          </div>
          <nav aria-label="Main" className="mt-6">
            <ul className="space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={close} className="font-display text-[clamp(2.25rem,12vw,3rem)] font-black leading-tight">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/search" onClick={close} className="font-display text-[clamp(2.25rem,12vw,3rem)] font-black leading-tight">
                  Search
                </Link>
              </li>
            </ul>
          </nav>
          <div className="mt-10 flex flex-wrap gap-2" onClick={close}>
            {CATEGORIES.map((category) => (
              <CategoryPill key={category.slug} slug={category.slug} size="sm" />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
