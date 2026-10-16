"use client";

import { Files, Inbox, LogOut, SquarePen, Users, FileText, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/cx";
import { initials } from "@/lib/format";
import { isAdminPath } from "@/lib/mock/session";
import type { User } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Matches the current path exactly instead of by prefix. */
  exact?: boolean;
  badge?: number;
}

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

/**
 * Dashboard navigation: sidebar on large screens, bottom tab bar on phones.
 * In the preview both sections are shown; from Phase 3 the Editor section is admin-only.
 */
export function Sidebar({ author, admin, pendingCount }: { author: User; admin: User; pendingCount: number }) {
  const pathname = usePathname();
  const user = isAdminPath(pathname) ? admin : author;

  const writing: NavItem[] = [
    { href: "/dashboard", label: "My articles", icon: FileText, exact: true },
    { href: "/dashboard/articles/new", label: "New article", icon: SquarePen, exact: true },
  ];
  const editor: NavItem[] = [
    { href: "/dashboard/review", label: "Review queue", icon: Inbox, badge: pendingCount },
    { href: "/dashboard/articles", label: "All articles", icon: Files, exact: true },
    { href: "/dashboard/authors", label: "Authors", icon: Users },
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
          "flex items-center rounded-inner border-2 font-display font-extrabold",
          compact ? "flex-col gap-0.5 px-1 py-1.5 text-[10px]" : "gap-3 px-3 py-2 text-sm",
          active ? "border-ink bg-cat-events shadow-hard" : "border-transparent hover:border-ink hover:bg-surface",
        )}
      >
        <Icon aria-hidden="true" className={compact ? "size-5" : "size-4"} strokeWidth={2.5} />
        <span className={compact ? "" : "flex-1"}>{item.label}</span>
        {!compact && item.badge !== undefined && item.badge > 0 && (
          <span className="rounded-full border-2 border-ink bg-surface px-1.5 text-meta">{item.badge}</span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Large screens */}
      <aside className="hidden w-64 shrink-0 flex-col border-r-3 border-ink bg-paper p-4 lg:flex">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-9 -rotate-3 place-items-center rounded-lg border-2 border-ink bg-ink font-display text-sm font-black text-cat-events">
            SN
          </span>
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
            <span aria-hidden="true" className="grid size-10 place-items-center rounded-full border-2 border-ink bg-cat-organisations font-display font-black">
              {initials(user.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-extrabold">{user.name}</p>
              <span className="rounded-full border-2 border-ink bg-cat-events px-1.5 text-meta">{user.role}</span>
            </div>
          </div>
          <Link href="/login" className="mt-3 flex items-center gap-2 font-display text-sm font-extrabold hover:underline">
            <LogOut aria-hidden="true" className="size-4" strokeWidth={2.5} />
            Log out
          </Link>
        </div>
      </aside>

      {/* Phones and tablets: bottom tab bar */}
      <nav
        aria-label="Dashboard"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 gap-1 border-t-3 border-ink bg-paper p-1.5 lg:hidden"
      >
        {[writing[0], writing[1], editor[0], editor[1], editor[2]].map((item) => link(item, true))}
      </nav>
    </>
  );
}
