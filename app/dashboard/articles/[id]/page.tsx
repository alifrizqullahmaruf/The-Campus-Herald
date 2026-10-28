import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArticleEditor } from "@/components/editor/article-editor";
import { Button } from "@/components/ui/button";
import { getAllArticles, getArticleById } from "@/lib/data/articles";

// Allowed to wait for the server on a click: the page reads `params` at the top.
// Revisit when Phase 3 rebuilds the dashboard behind login.
export const instant = false;

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map((article) => ({ id: String(article.id) }));
}

async function load(params: PageProps<"/dashboard/articles/[id]">["params"]) {
  const id = Number((await params).id);
  return Number.isInteger(id) ? getArticleById(id) : null;
}

export async function generateMetadata({ params }: PageProps<"/dashboard/articles/[id]">): Promise<Metadata> {
  const article = await load(params);
  return { title: article ? `Edit: ${article.title}` : "Article" };
}

// Phase 3: only the article's author (or the admin) may open this page.
export default async function EditArticlePage({ params }: PageProps<"/dashboard/articles/[id]">) {
  const article = await load(params);
  if (!article) notFound();

  return (
    <>
      <PageHeader
        title="Edit article."
        description={article.title}
        actions={
          article.status === "published" ? (
            <Button href={`/articles/${article.slug}`} variant="secondary" arrow>
              View live
            </Button>
          ) : undefined
        }
      />
      <ArticleEditor article={article} />
    </>
  );
}
