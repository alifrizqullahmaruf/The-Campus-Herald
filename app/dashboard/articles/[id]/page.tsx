import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { ArticleEditor } from "@/components/editor/article-editor";
import { Button } from "@/components/ui/button";
import { displayTitle } from "@/lib/articles/draft-rules";
import { requireUser } from "@/lib/auth/current-user";
import { getArticleById } from "@/lib/data/articles";
import { isValidId } from "@/lib/data/ids";
import type { User } from "@/lib/types";

// Behind the login: rendered for each request, waiting for the session on the server.
export const instant = false;

// Only the article's author or the administrator may open it; to anyone else it does not exist.
async function load(params: PageProps<"/dashboard/articles/[id]">["params"], user: User) {
  const id = Number((await params).id);
  const article = isValidId(id) ? await getArticleById(id) : null;
  return article && (article.authorId === user.id || user.role === "admin") ? article : null;
}

export async function generateMetadata({ params }: PageProps<"/dashboard/articles/[id]">): Promise<Metadata> {
  const article = await load(params, await requireUser());
  return { title: article ? `Edit: ${displayTitle(article.title)}` : "Article" };
}

export default async function EditArticlePage({ params, searchParams }: PageProps<"/dashboard/articles/[id]">) {
  const user = await requireUser();
  const { saved } = await searchParams;
  const article = await load(params, user);
  if (!article) notFound();

  return (
    <>
      <PageHeader
        title="Edit article."
        description={displayTitle(article.title)}
        actions={
          article.status === "published" ? (
            <Button href={`/articles/${article.slug}`} variant="secondary" arrow>
              View live
            </Button>
          ) : undefined
        }
      />
      {/* Only the author saves; the administrator reviews someone else's article instead. */}
      <ArticleEditor article={article} canEdit={article.authorId === user.id} justSaved={saved === "1"} />
    </>
  );
}
