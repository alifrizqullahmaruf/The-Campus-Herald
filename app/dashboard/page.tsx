import type { Metadata } from "next";
import { MyArticles } from "@/components/dashboard/my-articles";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { getArticlesByAuthor } from "@/lib/data/articles";
import { PREVIEW_AUTHOR_ID } from "@/lib/mock/session";

export const metadata: Metadata = { title: "My articles" };

export default async function MyArticlesPage() {
  const articles = await getArticlesByAuthor(PREVIEW_AUTHOR_ID);
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
