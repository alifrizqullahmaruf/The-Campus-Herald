import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/article/article-body";
import { ArticleCover } from "@/components/article/article-cover";
import { ReviewPanel } from "@/components/dashboard/review-panel";
import { CategoryBadge } from "@/components/ui/category-badge";
import { getAllArticles, getArticleById } from "@/lib/data/articles";
import { formatDate } from "@/lib/format";

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map((article) => ({ id: String(article.id) }));
}

async function load(params: PageProps<"/dashboard/review/[id]">["params"]) {
  const id = Number((await params).id);
  return Number.isInteger(id) ? getArticleById(id) : null;
}

export async function generateMetadata({ params }: PageProps<"/dashboard/review/[id]">): Promise<Metadata> {
  const article = await load(params);
  return { title: article ? `Review: ${article.title}` : "Review" };
}

// Shows the article exactly as readers will see it, so the editor reviews the real thing.
export default async function ReviewPage({ params }: PageProps<"/dashboard/review/[id]">) {
  const article = await load(params);
  if (!article) notFound();

  // Bottom padding: room for the review bar, which grows with the "Send back" note on phones.
  return (
    <div className="pb-64 lg:pb-40">
      <Link href="/dashboard/review" className="tap-target font-display text-sm font-extrabold underline underline-offset-4">
        ← Review queue
      </Link>
      <p className="mt-4 text-meta text-ink-muted">
        Submitted by {article.author.name}
        {article.submittedAt && ` · ${formatDate(article.submittedAt)}`}
      </p>

      <article className="mt-6 rounded-card border-3 border-ink bg-paper p-5 md:p-8">
        <CategoryBadge name={article.category.name} />
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(32px,5vw,56px)] font-black leading-[0.95]">
          {article.title}
        </h1>
        <p className="mt-4 max-w-3xl text-xl leading-relaxed text-ink-muted">{article.excerpt}</p>
        <ArticleCover article={article} className="mt-6 aspect-16/9 max-w-3xl" sizes="(min-width: 1024px) 768px, 100vw" />
        <div className="mt-8">
          <ArticleBody article={article} />
        </div>
      </article>

      <ReviewPanel initialStatus={article.status} />
    </div>
  );
}
