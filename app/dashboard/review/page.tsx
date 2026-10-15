import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { CategoryBadge } from "@/components/ui/category-badge";
import { getPendingArticles } from "@/lib/data/articles";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Review queue" };

export default async function ReviewQueuePage() {
  const queue = await getPendingArticles();
  return (
    <>
      <PageHeader
        title="Review queue."
        description="Every article waits here until you approve it or send it back. Oldest first."
      />
      {queue.length === 0 ? (
        <div className="mt-8 rounded-card border-3 border-ink bg-surface p-8 text-center shadow-hard">
          <p className="font-display text-xl font-black">The queue is empty.</p>
          <p className="mt-1 text-ink-muted">New submissions from authors will appear here.</p>
        </div>
      ) : (
        <ol className="mt-6 space-y-3">
          {queue.map((article, i) => (
            <li
              key={article.id}
              className="relative flex items-center gap-4 rounded-card border-3 border-ink bg-surface p-4 transition-shadow hover:shadow-hard focus-within:shadow-hard"
            >
              <span aria-hidden="true" className="font-display text-3xl font-black text-ink/20">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-extrabold leading-tight">
                  <Link href={`/dashboard/review/${article.id}`} className="after:absolute after:inset-0">
                    {article.title}
                  </Link>
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-meta text-ink-muted">
                  <CategoryBadge name={article.category.name} />
                  <span>{article.author.name}</span>
                  <span aria-hidden="true">·</span>
                  <span>Submitted {formatDate(article.submittedAt)}</span>
                </p>
              </div>
              <span aria-hidden="true" className="font-display font-extrabold">
                Review →
              </span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
