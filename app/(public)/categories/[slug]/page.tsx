import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/article/article-card";
import { MostRead } from "@/components/article/most-read";
import { Container } from "@/components/layout/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { LoadMore } from "@/components/ui/load-more";
import { CATEGORIES, getCategoryBySlug } from "@/lib/categories";
import { cx } from "@/lib/cx";
import { getPublishedArticles } from "@/lib/data/articles";

// Cache Components requires at least one param; all five topics are known up front.
export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const category = getCategoryBySlug((await params).slug);
  if (!category) return {};
  return { title: category.name, description: category.description };
}

export default async function CategoryPage({ params }: PageProps<"/categories/[slug]">) {
  const category = getCategoryBySlug((await params).slug);
  if (!category) notFound();
  const articles = await getPublishedArticles({ category: category.slug });
  const Icon = category.icon;

  return (
    <>
      <header className={cx("border-b-3 border-ink py-14 md:py-20", category.bgClass, category.textClass)}>
        <Container>
          <Eyebrow>Topic</Eyebrow>
          {/* The topic name is one long word: sized to fit a 320px screen and the 1120px column. */}
          <h1 className="mt-3 flex flex-col items-start gap-3 font-display text-[clamp(28px,8.4vw,104px)] font-black leading-[0.95] sm:flex-row sm:items-center sm:gap-4">
            <Icon aria-hidden="true" className="size-[0.8em] shrink-0" strokeWidth={2.5} />
            {category.name}
          </h1>
          <p className="mt-4 max-w-xl text-lg">{category.description}</p>
          <p className="mt-4 text-meta">
            {articles.length} {articles.length === 1 ? "article" : "articles"} · newest first
          </p>
        </Container>
      </header>

      <Container className="grid gap-12 py-14 md:py-20 lg:grid-cols-[1fr_320px] lg:items-start">
        <section aria-label={`${category.name} articles`}>
          {articles.length === 0 ? (
            <p className="rounded-card border-3 border-ink bg-surface p-6 text-ink-muted shadow-hard">
              Nothing in this topic yet. Check back soon.
            </p>
          ) : (
            <LoadMore className="grid gap-6 sm:grid-cols-2">
              {articles.map((article) => (
                <li key={article.id} className="flex">
                  <ArticleCard article={article} className="w-full" headingLevel="h2" />
                </li>
              ))}
            </LoadMore>
          )}
        </section>
        <aside className="lg:sticky lg:top-24">
          <MostRead compact />
        </aside>
      </Container>
    </>
  );
}
