import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArticleCard } from "@/components/article/article-card";
import { Container } from "@/components/layout/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { AuthorSkeleton } from "@/components/ui/skeleton";
import { getPublishedArticlesByAuthor } from "@/lib/data/articles";
import { getAllAuthorIds, getAuthorProfile } from "@/lib/data/users";
import { Avatar } from "@/components/author/avatar";

export async function generateStaticParams() {
  const ids = await getAllAuthorIds();
  return ids.map((id) => ({ id: String(id) }));
}

async function load(params: PageProps<"/authors/[id]">["params"]) {
  const id = Number((await params).id);
  return Number.isInteger(id) ? getAuthorProfile(id) : null;
}

export async function generateMetadata({ params }: PageProps<"/authors/[id]">): Promise<Metadata> {
  const author = await load(params);
  if (!author) return {};
  return { title: author.name, description: author.bio };
}

// params is URL data: read inside Suspense so a click on a writer link shows the
// skeleton at once (instant navigation).
export default function AuthorPage({ params }: PageProps<"/authors/[id]">) {
  return (
    <Suspense fallback={<AuthorSkeleton />}>
      <Author params={params} />
    </Suspense>
  );
}

async function Author({ params }: { params: PageProps<"/authors/[id]">["params"] }) {
  const author = await load(params);
  if (!author) notFound();
  const articles = await getPublishedArticlesByAuthor(author.id);

  return (
    <>
      <header className="border-b-3 border-ink">
        <Container className="flex flex-col gap-8 py-14 md:flex-row md:items-center md:py-20">
          <Avatar userId={author.id} className="size-36 shrink-0 -rotate-2 rounded-card border-3 border-ink shadow-hard md:size-48" />
          <div>
            <div className="flex flex-wrap gap-2">
              <Eyebrow>{author.beat}</Eyebrow>
              {!author.isActive && (
                <span className="rounded-full border-2 border-dashed border-ink bg-surface px-2.5 py-0.5 text-meta">
                  Former member
                </span>
              )}
            </div>
            <h1 className="mt-3 font-display text-[clamp(36px,7vw,80px)] font-black leading-[0.95]">{author.name}</h1>
            <p className="mt-4 max-w-xl text-lg text-ink-muted">{author.bio}</p>
            <p className="mt-4 text-meta">
              {author.articleCount} published {author.articleCount === 1 ? "article" : "articles"}
            </p>
          </div>
        </Container>
      </header>

      <Container className="py-14 md:py-20">
        <h2 className="font-display text-[clamp(28px,4vw,48px)] font-black leading-none">
          Articles by {author.name.split(" ")[0]}.
        </h2>
        {articles.length === 0 ? (
          <p className="mt-8 rounded-card border-3 border-ink bg-surface p-6 text-ink-muted shadow-hard">
            No published articles yet.
          </p>
        ) : (
          <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <li key={article.id} className="flex">
                <ArticleCard article={article} className="w-full" />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
