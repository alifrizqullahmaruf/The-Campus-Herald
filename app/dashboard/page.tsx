import type { Metadata } from "next";
import { MyArticles } from "@/components/dashboard/my-articles";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { getArticlesByAuthor } from "@/lib/data/articles";
import { requireUser } from "@/lib/auth/current-user";

export const metadata: Metadata = { title: "My articles" };

// Behind the login: rendered for each request, waiting for the session on the server.
export const instant = false;

export default async function MyArticlesPage() {
  const author = await requireUser();
  const articles = await getArticlesByAuthor(author.id);
  // The list does not need article bodies.
  const light = articles.map((article) => ({ ...article, body: "" }));
  return (
    <>
      <PageHeader
        title="My articles."
        description="Drafts, articles waiting for the editor, and everything you have published."
        actions={
          <Button href="/dashboard/articles/new" arrow>
            New article
          </Button>
        }
      />
      <MyArticles articles={light} />
    </>
  );
}
