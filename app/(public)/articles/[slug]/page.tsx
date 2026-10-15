import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/article/article-body";
import { ArticleCard } from "@/components/article/article-card";
import { ArticleCover } from "@/components/article/article-cover";
import { AuthorBox } from "@/components/article/author-box";
import { FiledUnder } from "@/components/article/filed-under";
import { Container } from "@/components/layout/container";
import { CategoryBadge } from "@/components/ui/category-badge";
import { getAdjacentArticles, getArticleBySlug, getPublishedArticles } from "@/lib/data/articles";
import { formatDate } from "@/lib/format";

export async function generateStaticParams() {
  const articles = await getPublishedArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps<"/articles/[slug]">): Promise<Metadata> {
  const article = await getArticleBySlug((await params).slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt,
    authors: [{ name: article.author.name }],
    openGraph: { type: "article", title: article.title, description: article.excerpt },
  };
}

export default async function ArticlePage({ params }: PageProps<"/articles/[slug]">) {
  const article = await getArticleBySlug((await params).slug);
  if (!article) notFound();

  const [sameCategory, { newer, older }] = await Promise.all([
    getPublishedArticles({ category: article.category.slug }),
    getAdjacentArticles(article.slug),
  ]);
  const related = sameCategory.filter((a) => a.id !== article.id).slice(0, 2);

  return (
    <article>
      <Container className="py-12 md:py-16">
        <header className="max-w-3xl">
          <Link href={`/categories/${article.category.slug}`}>
            <CategoryBadge name={article.category.name} />
          </Link>
          <h1 className="mt-4 font-display text-[clamp(36px,6vw,72px)] font-black leading-[0.95]">
            {article.title}
          </h1>
          <p className="mt-5 text-xl leading-relaxed text-ink-muted">{article.excerpt}</p>
          <p className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-meta">
            <Link href={`/authors/${article.author.id}`} className="underline underline-offset-4">
              {article.author.name}
            </Link>
            <span aria-hidden="true">·</span>
            <time dateTime={article.publishedAt ?? undefined}>{formatDate(article.publishedAt)}</time>
            <span aria-hidden="true">·</span>
            <span>{article.readingMinutes} min read</span>
          </p>
        </header>

        <ArticleCover
          article={article}
          priority
          sizes="(min-width: 1120px) 1056px, 100vw"
          className="mt-8 aspect-16/9 rounded-card border-3 shadow-hard"
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[240px_1fr]">
          <div className="order-last lg:order-first">
            <div className="lg:sticky lg:top-24">
              <FiledUnder slug={article.category.slug} />
            </div>
          </div>
          <div className="min-w-0">
            <ArticleBody article={article} />
            <div className="mt-12 max-w-[68ch]">
              <AuthorBox author={article.author} category={article.category.slug} />
            </div>
          </div>
        </div>
      </Container>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="border-t-3 border-ink">
          <Container className="py-14 md:py-20">
            <h2 id="related-title" className="font-display text-[clamp(28px,4vw,48px)] font-black leading-none">
              More in {article.category.name}.
            </h2>
            <ul className="mt-8 grid gap-6 md:grid-cols-2">
              {related.map((a) => (
                <li key={a.id} className="flex">
                  <ArticleCard article={a} className="w-full" />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <nav aria-label="More articles" className="border-t-3 border-ink">
        <Container className="grid gap-4 py-8 sm:grid-cols-2">
          <div>
            {older && (
              <Link href={`/articles/${older.slug}`} className="group block">
                <span className="text-meta text-ink-muted">← Older</span>
                <span className="mt-1 block font-display text-lg font-extrabold leading-tight group-hover:underline">
                  {older.title}
                </span>
              </Link>
            )}
          </div>
          <div className="sm:text-right">
            {newer && (
              <Link href={`/articles/${newer.slug}`} className="group block">
                <span className="text-meta text-ink-muted">Newer →</span>
                <span className="mt-1 block font-display text-lg font-extrabold leading-tight group-hover:underline">
                  {newer.title}
                </span>
              </Link>
            )}
          </div>
        </Container>
      </nav>
    </article>
  );
}
