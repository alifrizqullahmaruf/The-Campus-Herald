"use client";

import { Files, Inbox, LogOut, SquarePen, Users, FileText, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/layout/logo-mark";
import { cx } from "@/lib/cx";
import { Avatar } from "@/components/author/avatar";
import { isAdminPath } from "@/lib/mock/session";
import type { User } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  /** One word for the phone tab bar; the rest of the label stays for screen readers. */
  short: string;
  icon: LucideIcon;
  /** Matches the current path exactly instead of by prefix. */
  exact?: boolean;
  badge?: number;
}

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

/**
 * Phones and tablets (below lg): a small bar above the page with the logo, who is
 * signed in and Log out, which otherwise only the large-screen sidebar has.
 */
export function DashboardTopBar({ author, admin }: { author: User; admin: User }) {
  const pathname = usePathname();
  const user = isAdminPath(pathname) ? admin : author;
  return (
    <div className="flex items-center justify-between gap-3 border-b-3 border-ink bg-paper px-4 py-2 sm:px-6 lg:hidden">
      <Link href="/" className="logo-link flex min-h-11 items-center gap-2">
        <LogoMark className="w-9" />
        <span className="sr-only">Side Notes </span>
        {/* Below 360px the word would push Log out into the gutter; it stays as the link's name. */}
        <span className="font-display text-sm font-black uppercase leading-none max-[359px]:sr-only">Dashboard</span>
      </Link>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-2">
          <Avatar userId={user.id} className="size-8 shrink-0 rounded-full border-2 border-ink" />
          <span className="sr-only">Signed in as {user.name}, </span>
          <span className="hidden rounded-full border-2 border-ink bg-cat-events px-1.5 text-meta sm:inline">{user.role}</span>
          <span className="sr-only sm:hidden">{user.role}</span>
        </span>
        <Link href="/login" className="flex min-h-11 items-center gap-1.5 font-display text-sm font-extrabold whitespace-nowrap hover:underline">
          <LogOut aria-hidden="true" className="size-4" strokeWidth={2.5} />
          Log out
        </Link>
      </div>
    </div>
  );
}

/**
 * Dashboard navigation: sidebar on large screens, bottom tab bar on phones.
 * In the preview both sections are shown; from Phase 3 the Editor section is admin-only.
 */
export function Sidebar({ author, admin, pendingCount }: { author: User; admin: User; pendingCount: number }) {
  const pathname = usePathname();
  const user = isAdminPath(pathname) ? admin : author;

  const writing: NavItem[] = [
    { href: "/dashboard", label: "My articles", short: "Mine", icon: FileText, exact: true },
    { href: "/dashboard/articles/new", label: "New article", short: "New", icon: SquarePen, exact: true },
  ];
  const editor: NavItem[] = [
    { href: "/dashboard/review", label: "Review queue", short: "Review", icon: Inbox, badge: pendingCount },
    { href: "/dashboard/articles", label: "All articles", short: "All", icon: Files, exact: true },
    { href: "/dashboard/authors", label: "Authors", short: "Authors", icon: Users },
  ];

  const link = (item: NavItem, compact = false) => {
    const active = isActive(pathname, item);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cx(
          "relative flex items-center rounded-inner border-2 font-display font-extrabold",
          compact ? "flex-col justify-center gap-0.5 px-1 text-[11px]" : "min-h-11 gap-3 px-3 py-2 text-sm",
          active ? "border-ink bg-cat-events shadow-hard" : "border-transparent hover:border-ink hover:bg-surface",
        )}
      >
        <Icon aria-hidden="true" className={compact ? "size-5" : "size-4"} strokeWidth={2.5} />
        {compact ? (
          // One line on a 320px screen; the accessible name is still the full label
          // and starts with the visible word (WCAG 2.5.3 Label in Name).
          <>
            <span className="whitespace-nowrap">{item.short}</span>
            <span className="sr-only">
              {item.label.startsWith(item.short) ? item.label.slice(item.short.length) : `, ${item.label.toLowerCase()}`}
            </span>
          </>
        ) : (
          <span className="flex-1">{item.label}</span>
        )}
        {item.badge !== undefined && item.badge > 0 && (
          <span
            className={cx(
              "rounded-full border-2 border-ink bg-surface px-1.5 text-meta",
              compact && "absolute top-0.5 right-1 leading-none",
            )}
          >
            {item.badge}
            {compact && <span className="sr-only"> waiting</span>}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Large screens */}
      {/* Sticky, so the navigation and Log out stay in view on long pages (editor, review). */}
      <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto border-r-3 border-ink bg-paper p-4 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:self-start">
        <Link href="/" className="logo-link flex items-center gap-2.5">
          <LogoMark className="w-11" />
          <span className="font-display text-sm font-black uppercase leading-none">
            Side Notes
            <br />
            Dashboard
          </span>
        </Link>

        <nav aria-label="Dashboard" className="mt-8 flex flex-1 flex-col gap-6">
          <div>
            <p className="px-3 text-meta text-ink-muted">Writing</p>
            <div className="mt-2 space-y-1">{writing.map((item) => link(item))}</div>
          </div>
          <div>
            <p className="px-3 text-meta text-ink-muted">Editor</p>
            <div className="mt-2 space-y-1">{editor.map((item) => link(item))}</div>
          </div>
        </nav>

        <div className="mt-6 rounded-card border-3 border-ink bg-surface p-3 shadow-hard">
          <div className="flex items-center gap-3">
            <Avatar userId={user.id} className="size-10 shrink-0 rounded-full border-2 border-ink" />
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-extrabold">{user.name}</p>
              <span className="rounded-full border-2 border-ink bg-cat-events px-1.5 text-meta">{user.role}</span>
            </div>
          </div>
          <Link href="/login" className="mt-3 flex min-h-11 items-center gap-2 font-display text-sm font-extrabold hover:underline">
            <LogOut aria-hidden="true" className="size-4" strokeWidth={2.5} />
            Log out
          </Link>
        </div>
      </aside>

      {/* Phones and tablets: bottom tab bar */}
      <nav
        aria-label="Dashboard"
        className="fixed inset-x-0 bottom-0 z-40 grid h-[calc(var(--tabbar-h)+env(safe-area-inset-bottom))] grid-cols-5 gap-1 border-t-3 border-ink bg-paper px-1.5 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] lg:hidden"
      >
        {[writing[0], writing[1], editor[0], editor[1], editor[2]].map((item) => link(item, true))}
      </nav>
    </>
  );
}
