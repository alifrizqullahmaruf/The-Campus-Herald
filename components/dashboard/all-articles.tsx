"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { CategoryBadge } from "@/components/ui/category-badge";
import { STATUS_STYLES, StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";
import type { ArticleStatus, ArticleWithRelations } from "@/lib/types";

const STATUSES: ArticleStatus[] = ["pending", "draft", "rejected", "published"];

/** Admin overview of every article, filterable by status and author. */
export function AllArticles({ articles }: { articles: ArticleWithRelations[] }) {
  const statusId = useId();
  const authorId = useId();
  const [status, setStatus] = useState<ArticleStatus | "">("");
  const [author, setAuthor] = useState("");

  const authors = [...new Map(articles.map((a) => [a.author.id, a.author.name])).entries()].sort((a, b) =>
    a[1].localeCompare(b[1]),
  );
  const shown = articles.filter(
    (a) => (status === "" || a.status === status) && (author === "" || String(a.author.id) === author),
  );

  const select =
    "h-11 rounded-inner border-3 border-ink bg-surface px-3 outline-none focus:outline-3 focus:outline-offset-2 focus:outline-cat-events";

  return (
    <>
      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor={statusId} className="mb-1 block text-sm font-semibold">
            Status
          </label>
          <select id={statusId} value={status} onChange={(e) => setStatus(e.target.value as ArticleStatus | "")} className={select}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_STYLES[s].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={authorId} className="mb-1 block text-sm font-semibold">
            Author
          </label>
          <select id={authorId} value={author} onChange={(e) => setAuthor(e.target.value)} className={select}>
            <option value="">All authors</option>
            {authors.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <p aria-live="polite" className="pb-3 text-meta text-ink-muted">
          {shown.length} of {articles.length}
        </p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-card border-3 border-ink bg-surface">
        <table className="w-full min-w-[720px] text-left">
          <thead className="border-b-3 border-ink bg-paper text-meta">
            <tr>
              <th scope="col" className="px-4 py-3">Title</th>
              <th scope="col" className="px-4 py-3">Author</th>
              <th scope="col" className="px-4 py-3">Category</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((a) => (
              <tr key={a.id} className="border-b-2 border-ink/10 last:border-0 hover:bg-paper">
                <td className="px-4 py-3 font-display font-extrabold">
                  <Link href={`/dashboard/review/${a.id}`} className="hover:underline">
                    {a.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm">{a.author.name}</td>
                <td className="px-4 py-3">
                  <CategoryBadge name={a.category.name} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={a.status} />
                </td>
                <td className="px-4 py-3 text-meta">{formatDate(a.publishedAt ?? a.submittedAt ?? a.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <p className="p-6 text-center text-ink-muted">No articles match these filters.</p>}
      </div>
    </>
  );
}
