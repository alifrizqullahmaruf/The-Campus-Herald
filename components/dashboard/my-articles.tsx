"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/ui/category-badge";
import { STATUS_STYLES, StatusBadge } from "@/components/ui/status-badge";
import { cx } from "@/lib/cx";
import { formatDate } from "@/lib/format";
import type { ArticleStatus, ArticleWithRelations } from "@/lib/types";

const FILTERS: Array<ArticleStatus | "all"> = ["all", "draft", "pending", "rejected", "published"];

/** The author's own articles with status filter tabs (docs/design.md 4, My articles). */
export function MyArticles({ articles }: { articles: ArticleWithRelations[] }) {
  const [filter, setFilter] = useState<ArticleStatus | "all">("all");
  const count = (f: ArticleStatus | "all") => (f === "all" ? articles.length : articles.filter((a) => a.status === f).length);
  const shown = filter === "all" ? articles : articles.filter((a) => a.status === filter);

  return (
    <>
      <div role="group" aria-label="Filter by status" className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={cx(
              "tap-target inline-flex items-center gap-2 rounded-full border-2 border-ink px-3 py-1 font-display text-sm font-extrabold",
              filter === f ? "bg-ink text-paper" : "bg-surface hover:bg-cat-events",
            )}
          >
            {f === "all" ? "All" : STATUS_STYLES[f].label}
            <span className="text-meta opacity-70">{count(f)}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="mt-8 rounded-card border-3 border-ink bg-surface p-8 text-center shadow-hard">
          <p className="font-display text-xl font-black">Nothing here yet.</p>
          <p className="mt-1 text-ink-muted">Articles you write show up in this list.</p>
          <div className="mt-5">
            <Button href="/dashboard/articles/new" arrow>
              Write your first article
            </Button>
          </div>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {shown.map((article) => (
            <li
              key={article.id}
              className="relative rounded-card border-3 border-ink bg-surface p-4 transition-shadow hover:shadow-hard focus-within:shadow-hard"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-display text-lg font-extrabold leading-tight">
                    <Link href={`/dashboard/articles/${article.id}`} className="after:absolute after:inset-0">
                      {article.title}
                    </Link>
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-meta text-ink-muted">
                    <CategoryBadge name={article.category.name} />
                    <span>
                      {article.status === "published"
                        ? `Published ${formatDate(article.publishedAt)}`
                        : `Updated ${formatDate(article.createdAt)}`}
                    </span>
                  </p>
                </div>
                <StatusBadge status={article.status} className="self-start" />
              </div>
              {article.status === "rejected" && article.reviewNote && (
                <p className="mt-3 rounded-inner border-2 border-cat-opinion bg-cat-opinion/10 px-3 py-2 text-sm">
                  <span className="font-semibold">Editor’s note:</span> {article.reviewNote}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
